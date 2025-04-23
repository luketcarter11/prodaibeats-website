import { R2_BUCKET_NAME, r2Client } from './r2Config'
import { ListObjectsV2Command } from '@aws-sdk/client-s3'

export interface StorageStats {
  audio: number
  metadata: number
  covers: number
}

/**
 * Count files in R2 storage by prefix and extension
 */
export async function countFilesByType(): Promise<StorageStats> {
  const stats: StorageStats = {
    audio: 0,
    metadata: 0,
    covers: 0
  }

  // Count audio files
  const audioFiles = await listFilesByPrefix('tracks/', '.mp3')
  stats.audio = audioFiles.length

  // Count metadata files
  const metadataFiles = await listFilesByPrefix('metadata/', '.json')
  stats.metadata = metadataFiles.length

  // Count cover files
  const coverFiles = await listFilesByPrefix('covers/', '.jpg')
  stats.covers = coverFiles.length

  return stats
}

/**
 * List files in R2 storage by prefix and extension
 */
async function listFilesByPrefix(prefix: string, extension: string): Promise<string[]> {
  const files: string[] = []
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
        if (item.Key && item.Key.endsWith(extension)) {
          files.push(item.Key)
        }
      }
    }
    continuationToken = response.NextContinuationToken
  } while (continuationToken)

  return files
} 