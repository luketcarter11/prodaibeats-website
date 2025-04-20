import { PutObjectCommand, GetObjectCommand, NoSuchKey } from '@aws-sdk/client-s3';
import { R2_BUCKET_NAME, isProd, hasR2Credentials, r2Client } from './r2Config';

/**
 * R2-based storage system for saving application state to JSON files in Cloudflare R2
 */
export class R2Storage {
  private bucketName: string;
  private isReady: boolean;

  constructor() {
    // Set ready flag - only use R2 if we have credentials and are in production
    this.isReady = isProd || hasR2Credentials();
    
    // Log the initialization for debugging
    console.log(`🔧 Initializing R2Storage, isReady: ${this.isReady}, isProd: ${isProd}`);
    
    this.bucketName = R2_BUCKET_NAME;
  }

  /**
   * Save data to a JSON file in R2 storage
   * @param key The key/path where to save the file in R2
   * @param data Data to save (will be serialized to JSON)
   * @returns Promise that resolves when the data is saved
   */
  async save(key: string, data: any): Promise<void> {
    // Skip actual R2 operations if not ready (development without credentials)
    if (!this.isReady) {
      console.log(`⚠️ R2Storage not ready, skipping save operation for: ${key}`);
      return;
    }
    
    try {
      console.log(`📤 Saving data to R2: ${key}`);
      
      // Prepare data for upload
      const jsonString = JSON.stringify(data, null, 2);
      const objectParams = {
        Bucket: this.bucketName,
        Key: key.endsWith('.json') ? key : `${key}.json`,
        Body: jsonString,
        ContentType: 'application/json',
      };

      // Upload to R2
      await r2Client.send(new PutObjectCommand(objectParams));
      console.log(`✅ Successfully saved data to R2: ${key}`);
    } catch (error) {
      console.error(`❌ Error saving to R2 (${key}):`, error);
      throw new Error(`Failed to save data to R2: ${key}`);
    }
  }

  /**
   * Load data from a JSON file in R2 storage
   * @param key The key/path from where to load the file in R2
   * @param defaultData Default data to return if file doesn't exist
   * @returns Promise that resolves with the parsed data
   */
  async load<T>(key: string, defaultData: T): Promise<T> {
    // Skip actual R2 operations if not ready (development without credentials)
    if (!this.isReady) {
      console.log(`⚠️ R2Storage not ready, using default data for: ${key}`);
      return defaultData;
    }
    
    try {
      console.log(`📥 Loading data from R2: ${key}`);
      
      const objectParams = {
        Bucket: this.bucketName,
        Key: key.endsWith('.json') ? key : `${key}.json`,
      };

      // Get object from R2
      const response = await r2Client.send(new GetObjectCommand(objectParams));
      
      // Convert readable stream to string
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      const jsonString = buffer.toString('utf-8');
      
      // Parse JSON
      const parsedData = JSON.parse(jsonString) as T;
      console.log(`✅ Successfully loaded data from R2: ${key}`);
      return parsedData;
    } catch (error) {
      // If the object doesn't exist, return the default data
      if (error instanceof NoSuchKey || (error as any).name === 'NoSuchKey') {
        console.log(`⚠️ Object not found in R2, using default data: ${key}`);
        return defaultData;
      }
      
      // For any other error, log and return default data
      console.error(`❌ Error loading from R2 (${key}):`, error);
      return defaultData;
    }
  }
}

// Singleton instance
export const r2Storage = new R2Storage(); 