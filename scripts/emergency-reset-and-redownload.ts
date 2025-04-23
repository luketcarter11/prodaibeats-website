import { R2_BUCKET_NAME, hasR2Credentials, r2Client } from '../src/lib/r2Config'
import { ListObjectsV2Command, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { checkAndRunScheduler } from '../src/lib/scheduler-job'
import { countFilesByType } from '../src/lib/storage-utils'
import { getScheduler } from '../src/lib/models/Scheduler'
import { trackHistory } from '../src/lib/models/TrackHistory'
import { Scheduler } from '../src/lib/models/Scheduler'
import { runSchedulerNow } from '../src/lib/scheduler-job'

interface ResetStats {
  deleted: {
    audio: number
    metadata: number
    covers: number
    list: number
    scheduler: number
  }
  skipped: number
  notFound: number
}

async function fileExistsInR2(key: string): Promise<boolean> {
  try {
    await r2Client.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    )
    return true
  } catch (error) {
    return false
  }
}

async function deleteFile(key: string, dryRun: boolean): Promise<{ deleted: boolean; skipped: boolean; notFound: boolean }> {
  const exists = await fileExistsInR2(key)
  
  if (!exists) {
    console.log(`⚠️ File not found: ${key}`)
    return { deleted: false, skipped: false, notFound: true }
  }

  if (dryRun) {
    console.log(`⚠️ Would delete: ${key}`)
    return { deleted: true, skipped: false, notFound: false }
  }

  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    )
    console.log(`✅ Deleted: ${key}`)
    return { deleted: true, skipped: false, notFound: false }
  } catch (error) {
    console.error(`❌ Failed to delete ${key}:`, error)
    return { deleted: false, skipped: true, notFound: false }
  }
}

async function listAndDeleteFiles(prefix: string, extension: string, dryRun: boolean): Promise<{ deleted: number; skipped: number; notFound: number }> {
  if (!hasR2Credentials()) {
    throw new Error('R2 credentials not found in environment variables')
  }

  let deleted = 0
  let skipped = 0
  let notFound = 0
  let continuationToken: string | undefined

  do {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    })

    const response = await r2Client.send(command)
    if (response.Contents) {
      for (const item of response.Contents) {
        if (!item.Key || !item.Key.endsWith(extension)) continue

        const result = await deleteFile(item.Key, dryRun)
        if (result.deleted) deleted++
        if (result.skipped) skipped++
        if (result.notFound) notFound++
      }
    }
    continuationToken = response.NextContinuationToken
  } while (continuationToken)

  return { deleted, skipped, notFound }
}

async function resetAndRedownload(dryRun: boolean): Promise<ResetStats> {
  console.log('🔍 Starting emergency reset...')
  
  const stats: ResetStats = {
    deleted: {
      audio: 0,
      metadata: 0,
      covers: 0,
      list: 0,
      scheduler: 0,
    },
    skipped: 0,
    notFound: 0,
  }

  // Delete audio files
  console.log('\n🗑️ Deleting audio files...')
  const audioResult = await listAndDeleteFiles('tracks/', '.mp3', dryRun)
  stats.deleted.audio = audioResult.deleted
  stats.skipped += audioResult.skipped
  stats.notFound += audioResult.notFound

  // Delete metadata files
  console.log('\n🗑️ Deleting metadata files...')
  const metadataResult = await listAndDeleteFiles('metadata/', '.json', dryRun)
  stats.deleted.metadata = metadataResult.deleted
  stats.skipped += metadataResult.skipped
  stats.notFound += metadataResult.notFound

  // Delete cover files
  console.log('\n🗑️ Deleting cover files...')
  const coversResult = await listAndDeleteFiles('covers/', '.jpg', dryRun)
  stats.deleted.covers = coversResult.deleted
  stats.skipped += coversResult.skipped
  stats.notFound += coversResult.notFound

  // Delete list.json
  console.log('\n🗑️ Deleting track list...')
  const listResult = await deleteFile('tracks/list.json', dryRun)
  if (listResult.deleted) stats.deleted.list = 1
  if (listResult.skipped) stats.skipped++
  if (listResult.notFound) stats.notFound++

  // Delete scheduler state
  console.log('\n🗑️ Deleting scheduler state...')
  const schedulerResult = await deleteFile('scheduler/scheduler.json', dryRun)
  if (schedulerResult.deleted) stats.deleted.scheduler = 1
  if (schedulerResult.skipped) stats.skipped++
  if (schedulerResult.notFound) stats.notFound++

  if (!dryRun) {
    console.log('\n🔄 Resetting scheduler state...')

    // Clear both trackHistory and downloadedTrackIds
    console.log('🧼 Clearing track history...')
    await trackHistory.clearAll()
    console.log('✅ Cleared track history')

    // 🔄 Create and reset scheduler from scratch
    const scheduler = await getScheduler({ fresh: true })
    await scheduler.clearDownloadedTrackIds()
    await scheduler.toggleActive(true)
    await scheduler.saveState()
    console.log('✅ Scheduler state reset')
    
    // Run the scheduler with force=true to redownload all tracks
    console.log('\n🔄 Starting forced fresh download...')
    await runSchedulerNow(true)

    // 🔁 Run forced download
    await checkAndRunScheduler(true)

    // 📦 Show R2 state
    const storageStats = await countFilesByType()
    console.log('\n📦 Current R2 Storage:')
    console.log(`🎵 Audio files: ${storageStats.audio} 📝 Metadata files: ${storageStats.metadata} 🖼️ Cover images: ${storageStats.covers}`)

    // Run fixListJson to ensure list.json is up to date
    console.log('\n🔄 Regenerating tracks/list.json...')
    const { execSync } = require('child_process')
    execSync('npx tsx scripts/fixListJson.ts', { stdio: 'inherit' })
    console.log('✅ Regenerated tracks/list.json')
  } else {
    console.log('\n🧪 Dry run complete - no files were deleted')
  }

  return stats
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  
  if (dryRun) {
    console.log('🧪 Running in dry-run mode (no files will be deleted)')
  }

  try {
    const stats = await resetAndRedownload(dryRun)
    
    console.log('\n📊 Summary:')
    console.log(`✅ Deleted ${stats.deleted.audio} audio files`)
    console.log(`✅ Deleted ${stats.deleted.metadata} metadata files`)
    console.log(`✅ Deleted ${stats.deleted.covers} cover files`)
    console.log(`✅ Deleted ${stats.deleted.list} track list files`)
    console.log(`✅ Deleted ${stats.deleted.scheduler} scheduler state files`)
    console.log(`⚠️ Skipped ${stats.skipped} files due to errors`)
    console.log(`⚠️ Not found: ${stats.notFound} files`)
  } catch (error) {
    console.error('❌ Error during reset:', error)
    process.exit(1)
  }
}

// Run the script
main() 