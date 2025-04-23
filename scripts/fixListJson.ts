import { ListObjectsV2Command, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { R2_BUCKET_NAME, r2Client } from '../src/lib/r2Config'

async function fixListJson() {
  try {
    console.log('🔍 Starting fix for tracks/list.json...')

    // First, check if list.json exists and is corrupted
    try {
      const getCommand = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: 'tracks/list.json',
      })
      
      const response = await r2Client.send(getCommand)
      const currentContent = await response.Body?.transformToString()
      
      if (currentContent) {
        try {
          const parsed = JSON.parse(currentContent)
          if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string' && item.startsWith('track_'))) {
            console.log('✅ tracks/list.json is valid, no fix needed')
            return
          }
        } catch (e) {
          console.log('⚠️ Current tracks/list.json is corrupted, will regenerate')
        }
      }
    } catch (e) {
      console.log('⚠️ tracks/list.json not found or inaccessible, will create new')
    }

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

    // Filter .json files and extract track IDs
    const trackIds = response.Contents
      .filter(item => item.Key?.endsWith('.json'))
      .map(item => {
        const filename = item.Key?.split('/').pop() || ''
        return filename.replace('.json', '')
      })
      .filter(id => id.startsWith('track_') && id.length > 7) // Ensure valid track IDs

    console.log(`📊 Found ${trackIds.length} valid track IDs in metadata/`)

    if (trackIds.length === 0) {
      console.log('⚠️ No valid track IDs found')
      await uploadEmptyList()
      return
    }

    // Create a clean array of IDs
    const cleanList = Array.from(new Set(trackIds)).sort()
    console.log('✅ Generated clean list of track IDs')

    // Convert to JSON string (only once!)
    const jsonString = JSON.stringify(cleanList, null, 2)
    console.log('📝 Generated JSON string (preview):', jsonString.substring(0, 100) + '...')

    // Upload to R2
    const putCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: 'tracks/list.json',
      Body: jsonString,
      ContentType: 'application/json',
    })

    await r2Client.send(putCommand)
    console.log('✅ Successfully uploaded fixed tracks/list.json to R2')

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