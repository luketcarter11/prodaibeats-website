import { ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { R2_BUCKET_NAME, r2Client } from '../src/lib/r2Config'
import { getR2PublicUrl } from '../src/lib/r2Config'

async function fixMetadataUrls() {
  try {
    console.log('🔍 Starting metadata URL fix...')
    
    // List all metadata files
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: 'metadata/',
    })
    
    const response = await r2Client.send(command)
    
    if (!response.Contents) {
      console.log('⚠️ No metadata files found')
      return
    }
    
    // Filter for .json files
    const metadataFiles = response.Contents.filter(item => item.Key?.endsWith('.json'))
    console.log(`📊 Found ${metadataFiles.length} metadata files to process`)
    
    let fixedCount = 0
    let errorCount = 0
    
    for (const file of metadataFiles) {
      try {
        const key = file.Key!
        const trackId = key.split('/').pop()?.replace('.json', '')
        
        if (!trackId) {
          console.warn(`⚠️ Invalid metadata file name: ${key}`)
          continue
        }
        
        // Get the current metadata
        const getCommand = new GetObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
        })
        
        const getResponse = await r2Client.send(getCommand)
        const metadataString = await getResponse.Body?.transformToString()
        
        if (!metadataString) {
          console.warn(`⚠️ Empty metadata file: ${key}`)
          continue
        }
        
        const metadata = JSON.parse(metadataString)
        
        // Generate the correct URLs
        const audioUrl = getR2PublicUrl(`tracks/${trackId}.mp3`)
        const coverUrl = getR2PublicUrl(`covers/${trackId}.jpg`)
        
        // Update metadata with new URLs
        const updatedMetadata = {
          ...metadata,
          audioUrl,
          coverUrl
        }
        
        // Upload the updated metadata
        const putCommand = new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: JSON.stringify(updatedMetadata, null, 2),
          ContentType: 'application/json',
        })
        
        await r2Client.send(putCommand)
        console.log(`✅ Updated metadata for ${trackId}`)
        fixedCount++
        
      } catch (error) {
        console.error(`❌ Error processing ${file.Key}:`, error)
        errorCount++
      }
    }
    
    console.log('\n📊 Fix complete!')
    console.log(`✅ Fixed: ${fixedCount} files`)
    console.log(`❌ Errors: ${errorCount}`)
    
  } catch (error) {
    console.error('❌ Error fixing metadata URLs:', error)
    process.exit(1)
  }
}

// Run the script
fixMetadataUrls() 