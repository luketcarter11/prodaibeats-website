#!/usr/bin/env node

import { hasR2Credentials, r2Client, R2_BUCKET_NAME } from '../src/lib/r2Config';
import { PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

async function checkR2Credentials() {
  try {
    console.log('🔍 Checking R2 credentials...');
    
    // Check if environment variables are loaded
    console.log('\n📋 Environment Variables:');
    console.log(`R2_ACCESS_KEY_ID: ${process.env.R2_ACCESS_KEY_ID ? '✅ Present' : '❌ Missing'}`);
    console.log(`R2_SECRET_ACCESS_KEY: ${process.env.R2_SECRET_ACCESS_KEY ? '✅ Present' : '❌ Missing'}`);
    console.log(`R2_ENDPOINT: ${process.env.R2_ENDPOINT ? '✅ Present' : '❌ Missing'}`);
    console.log(`R2_BUCKET: ${process.env.R2_BUCKET ? '✅ Present' : '❌ Missing'}`);
    
    // Check if credentials are valid
    console.log('\n🔐 Validating R2 credentials...');
    const hasCredentials = await hasR2Credentials();
    
    if (hasCredentials) {
      console.log('✅ R2 credentials are valid and working correctly');
      
      // Test listing objects in the bucket
      console.log('\n📦 Testing bucket access...');
      try {
        const listCommand = new ListObjectsV2Command({
          Bucket: R2_BUCKET_NAME,
          MaxKeys: 5
        });
        
        const response = await r2Client.send(listCommand);
        console.log(`✅ Successfully listed objects in bucket: ${R2_BUCKET_NAME}`);
        console.log(`Found ${response.Contents?.length || 0} objects in the bucket`);
        
        if (response.Contents && response.Contents.length > 0) {
          console.log('\n📄 Sample objects:');
          response.Contents.slice(0, 3).forEach((obj, index) => {
            console.log(`${index + 1}. ${obj.Key} (${obj.Size} bytes)`);
          });
        }
      } catch (error) {
        console.error('❌ Error listing objects:', error);
      }
      
      // Test saving and loading a test file
      console.log('\n📝 Testing save and load operations...');
      try {
        const testKey = 'test-credentials.json';
        const testData = {
          timestamp: new Date().toISOString(),
          message: 'R2 credentials test successful'
        };
        
        // Save test data
        const putCommand = new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: testKey,
          Body: JSON.stringify(testData),
          ContentType: 'application/json'
        });
        
        await r2Client.send(putCommand);
        console.log('✅ Successfully saved test data to R2');
        
        // Load test data
        const getCommand = new GetObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: testKey
        });
        
        const response = await r2Client.send(getCommand);
        const jsonString = await response.Body?.transformToString();
        const loadedData = jsonString ? JSON.parse(jsonString) : null;
        
        console.log('✅ Successfully loaded test data from R2');
        console.log('📄 Test data:', loadedData);
      } catch (error) {
        console.error('❌ Error testing save/load operations:', error);
      }
    } else {
      console.log('❌ R2 credentials are missing or invalid');
      console.log('\nTo set up R2 credentials, you need to:');
      console.log('1. Create a .env file in the project root if it doesn\'t exist');
      console.log('2. Add the following environment variables to your .env file:');
      console.log('   R2_ACCESS_KEY_ID=your_access_key_id');
      console.log('   R2_SECRET_ACCESS_KEY=your_secret_access_key');
      console.log('   R2_BUCKET=your_bucket_name (optional, defaults to prodai-beats-storage)');
      console.log('   R2_ENDPOINT=your_r2_endpoint (optional, defaults to Cloudflare R2 endpoint)');
      console.log('\nFor development without R2, the scheduler will use in-memory storage');
      console.log('but state will not persist between runs.');
    }
  } catch (error) {
    console.error('❌ Error checking R2 credentials:', error);
  }
}

checkR2Credentials(); 