import { ListObjectsV2Command, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { R2_BUCKET_NAME, r2Client } from '../src/lib/r2Config'

interface TrackMetadata {
  id: string
  title: string
  bpm: number
  duration: number
  audioUrl: string
  coverUrl: string
  price: number
  artist: string
  [key: string]: any // Allow additional fields
}

async function fixListJson() {
  try {
    console.log('🔍 Starting fix for tracks/list.json...')

    // List all objects under metadata/ prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: 'metadata/',
    })

    const response = await r2Client.send(listCommand)

    if (!response.Contents) {
      console.log('⚠️ No files found in metadata/ directory')
      await uploadEmptyList()
      return
    }

    // Filter .json files and process metadata
    const validTracks: TrackMetadata[] = []
    const skippedFiles: string[] = []

    for (const item of response.Contents) {
      if (!item.Key?.endsWith('.json')) continue

      try {
        const getCommand = new GetObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: item.Key,
        })

        const metadataResponse = await r2Client.send(getCommand)
        const metadataString = await metadataResponse.Body?.transformToString()

        if (!metadataString) {
          console.warn(`⚠️ Empty metadata file: ${item.Key}`)
          skippedFiles.push(item.Key)
          continue
        }

        const metadata = JSON.parse(metadataString)
        const trackId = item.Key.split('/').pop()?.replace('.json', '')

        // Validate required fields
        if (!trackId || !metadata.title || !metadata.bpm || !metadata.duration || 
            !metadata.audioUrl || !metadata.coverUrl || !metadata.price || !metadata.artist) {
          console.warn(`⚠️ Missing required fields in: ${item.Key}`)
          skippedFiles.push(item.Key)
          continue
        }

        // Create track object with required fields
        const track: TrackMetadata = {
          id: trackId,
          title: metadata.title,
          bpm: metadata.bpm,
          duration: metadata.duration,
          audioUrl: metadata.audioUrl,
          coverUrl: metadata.coverUrl,
          price: metadata.price,
          artist: metadata.artist,
          ...metadata // Include any additional fields
        }

        validTracks.push(track)
        console.log(`✅ Processed metadata for: ${trackId}`)

      } catch (error) {
        console.error(`❌ Error processing ${item.Key}:`, error)
        skippedFiles.push(item.Key)
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`✅ Valid tracks processed: ${validTracks.length}`)
    console.log(`⚠️ Skipped files: ${skippedFiles.length}`)
    
    if (skippedFiles.length > 0) {
      console.log('\nSkipped files:')
      skippedFiles.forEach(file => console.log(`  - ${file}`))
    }

    if (validTracks.length === 0) {
      console.log('⚠️ No valid tracks found')
      await uploadEmptyList()
      return
    }

    // Sort tracks by ID
    validTracks.sort((a, b) => a.id.localeCompare(b.id))

    // Convert to JSON string
    const jsonString = JSON.stringify(validTracks, null, 2)
    console.log('\n📝 Generated JSON string (preview):', jsonString.substring(0, 100) + '...')

    // Upload to R2
    const putCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: 'tracks/list.json',
      Body: jsonString,
      ContentType: 'application/json',
    })

    await r2Client.send(putCommand)
    console.log('\n✅ Successfully uploaded fixed tracks/list.json to R2')

    // Verify the upload
    const verifyCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: 'tracks/list.json',
    })

    const verifyResponse = await r2Client.send(verifyCommand)
    if (verifyResponse.Contents?.length === 1) {
      console.log('✅ Verification: tracks/list.json exists in R2')
    } else {
      console.warn('⚠️ Verification: tracks/list.json not found in R2')
    }

  } catch (error) {
    console.error('❌ Error fixing tracks/list.json:', error)
    process.exit(1)
  }
}

async function uploadEmptyList() {
  try {
    console.log('📝 Uploading empty array to tracks/list.json')
    const emptyList = JSON.stringify([], null, 2)

    const putCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: 'tracks/list.json',
      Body: emptyList,
      ContentType: 'application/json',
    })

    await r2Client.send(putCommand)
    console.log('✅ Successfully uploaded empty tracks/list.json to R2')
  } catch (error) {
    console.error('❌ Error uploading empty list:', error)
    process.exit(1)
  }
}

// Run the script
fixListJson() 