import { R2_BUCKET_NAME, hasR2Credentials, r2Client } from '../src/lib/r2Config'
import { ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'

interface CleanupStats {
  deleted: number
  missingMetadata: number
}

async function listFilesInR2(prefix: string): Promise<Set<string>> {
  if (!hasR2Credentials()) {
    throw new Error('R2 credentials not found in environment variables')
  }

  const files = new Set<string>()
  let continuationToken: string | undefined

  do {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    })

    const response = await r2Client.send(command)
    if (response.Contents) {
      response.Contents.forEach((item) => {
        if (item.Key) {
          // Remove prefix and extension to get clean track ID
          const trackId = item.Key
            .replace(prefix, '')
            .replace(/\.(mp3|json)$/, '')
          files.add(trackId)
        }
      })
    }
    continuationToken = response.NextContinuationToken
  } while (continuationToken)

  return files
}

async function deleteMetadataFile(trackId: string, dryRun: boolean): Promise<void> {
  const metadataKey = `tracks/metadata/${trackId}.json`
  
  if (dryRun) {
    console.log(`⚠️ Would delete: ${metadataKey}`)
    return
  }

  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: metadataKey,
      })
    )
    console.log(`✅ Deleted: ${metadataKey}`)
  } catch (error) {
    console.error(`❌ Failed to delete ${metadataKey}:`, error)
  }
}

async function cleanupOrphanedMetadata(dryRun: boolean): Promise<CleanupStats> {
  console.log('🔍 Scanning R2 storage...')
  
  const [audioFiles, metadataFiles] = await Promise.all([
    listFilesInR2('tracks/audio/'),
    listFilesInR2('tracks/metadata/'),
  ])

  const stats: CleanupStats = {
    deleted: 0,
    missingMetadata: 0,
  }

  // Find metadata files without matching audio
  for (const trackId of metadataFiles) {
    if (!audioFiles.has(trackId)) {
      await deleteMetadataFile(trackId, dryRun)
      stats.deleted++
    }
  }

  // Find audio files without matching metadata
  for (const trackId of audioFiles) {
    if (!metadataFiles.has(trackId)) {
      console.log(`⚠️ Missing metadata for audio track: ${trackId}`)
      stats.missingMetadata++
    }
  }

  return stats
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  
  if (dryRun) {
    console.log('🧪 Running in dry-run mode (no files will be deleted)')
  }

  try {
    const stats = await cleanupOrphanedMetadata(dryRun)
    
    console.log('\n📊 Summary:')
    console.log(`✅ Deleted: ${stats.deleted} orphaned metadata files`)
    console.log(`⚠️ Missing metadata for ${stats.missingMetadata} audio tracks`)
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    process.exit(1)
  }
}

// Run the script
main() 