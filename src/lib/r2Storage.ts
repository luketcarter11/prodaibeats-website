import { PutObjectCommand, GetObjectCommand, NoSuchKey } from '@aws-sdk/client-s3';
import { R2_BUCKET_NAME, isProd, hasR2Credentials, r2Client } from './r2Config';
import path from 'path';
import dotenv from 'dotenv';

// Only import fs in Node.js environment
let fs: typeof import('fs') | undefined;
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  try {
    fs = await import('fs');
  } catch (error) {
    console.warn('⚠️ Could not import fs module:', error);
  }
}

// Load environment variables from .env file
dotenv.config();

/**
 * R2-based storage system for saving application state to JSON files in Cloudflare R2
 * Falls back to local file storage when R2 is not available
 */
export class R2Storage {
  private bucketName: string;
  private isReady: boolean;
  private localStorageDir: string;
  public initializationPromise: Promise<void>;

  constructor() {
    this.bucketName = R2_BUCKET_NAME;
    this.isReady = false;
    this.localStorageDir = path.join(process.cwd(), 'data');
    
    // Initialize asynchronously
    this.initializationPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Check if all required credentials are present
      const missingVars = [];
      
      if (!process.env.R2_ACCESS_KEY_ID) missingVars.push('R2_ACCESS_KEY_ID');
      if (!process.env.R2_SECRET_ACCESS_KEY) missingVars.push('R2_SECRET_ACCESS_KEY');
      if (!process.env.R2_ENDPOINT) missingVars.push('R2_ENDPOINT');
      if (!process.env.R2_BUCKET) missingVars.push('R2_BUCKET');
      
      if (missingVars.length > 0) {
        console.log(`❌ R2 credentials missing: ${missingVars.join(', ')}`);
        this.isReady = false;
      } else {
        // Set ready flag - only use R2 if we have credentials and are in production
        this.isReady = isProd || await hasR2Credentials();
      }
      
      // Log the initialization for debugging
      console.log(`🔧 Initializing R2Storage, isReady: ${this.isReady}, isProd: ${isProd}`);
      
      // Create local storage directory if it doesn't exist (only in development)
      if (process.env.NODE_ENV !== 'production' && fs) {
        if (!fs.existsSync(this.localStorageDir)) {
          fs.mkdirSync(this.localStorageDir, { recursive: true });
        }
      }
    } catch (error) {
      console.error('❌ Error initializing R2Storage:', error);
      this.isReady = false;
    }
  }

  /**
   * Wait for initialization to complete
   */
  async waitForReady(): Promise<void> {
    await this.initializationPromise;
  }

  /**
   * Save data to storage (R2 or local file)
   * @param key The key/path where to save the file
   * @param data Data to save (will be serialized to JSON)
   * @returns Promise that resolves when the data is saved
   */
  async save(key: string, data: any): Promise<void> {
    // Wait for initialization and check if ready
    await this.waitForReady();
    
    try {
      if (this.isReady) {
        // Save to R2
        console.log(`📤 Saving data to R2: ${key}`);
        
        // Prepare data for upload
        const jsonString = JSON.stringify(data, null, 2);
        console.log(`📝 Data to save:`, data);
        console.log(`📝 JSON string:`, jsonString);
        
        const objectParams = {
          Bucket: this.bucketName,
          Key: key.endsWith('.json') ? key : `${key}.json`,
          Body: jsonString,
          ContentType: 'application/json',
        };

        // Upload to R2
        await r2Client.send(new PutObjectCommand(objectParams));
        console.log(`✅ Successfully saved data to R2: ${key}`);
      } else {
        // Save to local file
        console.log(`📤 Saving data to local storage: ${key}`);
        
        // Prevent local file fallback in production
        if (process.env.NODE_ENV === 'production') {
          console.error('❌ Tried to use local fallback in production! This should never happen.');
          throw new Error('Cannot save to local storage in production environment');
        }
        
        const filePath = path.join(this.localStorageDir, key.endsWith('.json') ? key : `${key}.json`);
        
        // Create directory if it doesn't exist
        const dir = path.dirname(filePath);
        if (!fs) {
          throw new Error('fs is not available in production environment');
        }
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Write data to file
        const jsonString = JSON.stringify(data, null, 2);
        console.log(`📝 Data to save:`, data);
        console.log(`📝 JSON string:`, jsonString);
        
        fs.writeFileSync(filePath, jsonString);
        console.log(`✅ Successfully saved data to local storage: ${key}`);
      }
    } catch (error) {
      console.error(`❌ Error saving data (${key}):`, error);
      throw new Error(`Failed to save data: ${key}`);
    }
  }

  /**
   * Load data from storage (R2 or local file)
   * @param key The key/path from where to load the file
   * @param defaultData Default data to return if file doesn't exist
   * @returns Promise that resolves with the parsed data
   */
  async load<T>(key: string, defaultData: T): Promise<T> {
    // Wait for initialization and check if ready
    await this.waitForReady();
    
    try {
      if (this.isReady) {
        // Load from R2
        console.log(`📥 Loading data from R2: ${key}`);
        
        const objectParams = {
          Bucket: this.bucketName,
          Key: key.endsWith('.json') ? key : `${key}.json`,
        };

        try {
          const response = await r2Client.send(new GetObjectCommand(objectParams));
          const jsonString = await response.Body?.transformToString();
          if (!jsonString) throw new Error('Empty response');
          
          console.log(`📝 Raw response:`, jsonString);
          
          // For list.json, we want to return the raw string if it's a special case
          // This allows the caller to handle parsing specially
          if (key === 'tracks/list.json') {
            // Return the raw string to allow special handling
            console.log(`ℹ️ Returning raw string for tracks/list.json for special handling`);
            return jsonString as unknown as T;
          }
          
          // Add special handling for metadata files to diagnose issues
          if (key.startsWith('metadata/') && key.endsWith('.json')) {
            console.log(`🔍 Special metadata file handling for: ${key}`);
            console.log(`🔍 Raw metadata content: ${jsonString.substring(0, 200)}${jsonString.length > 200 ? '...' : ''}`);
            
            // Check if the metadata appears to be a stringified JSON string (double encoded)
            if (jsonString.startsWith('"') && jsonString.endsWith('"')) {
              try {
                // This might be a double-encoded JSON string, try to parse it twice
                console.log('⚠️ Metadata appears to be double-encoded, attempting to fix');
                const unescaped = JSON.parse(jsonString);
                
                if (typeof unescaped === 'string') {
                  try {
                    // Try to parse the unescaped string
                    const parsedData = JSON.parse(unescaped);
                    console.log('✅ Successfully corrected double-encoded metadata');
                    return parsedData as T;
                  } catch (nestedError) {
                    console.error('❌ Error parsing unescaped metadata string:', nestedError);
                  }
                }
              } catch (parseError) {
                console.error('❌ Error unescaping metadata JSON:', parseError);
              }
            }
          }
          
          let data: T;
          try {
            data = JSON.parse(jsonString);
            console.log(`✅ Successfully parsed JSON:`, data);
          } catch (parseError) {
            console.error(`❌ Error parsing JSON for ${key}:`, parseError);
            console.log(`⚠️ Raw JSON with issues:`, jsonString);
            console.log(`⚠️ Using default data:`, defaultData);
            return defaultData;
          }
          
          console.log(`✅ Successfully loaded data from R2: ${key}`);
          return data;
        } catch (error) {
          if (error instanceof NoSuchKey) {
            console.log(`⚠️ No data found in R2 for: ${key}, using default`);
            return defaultData;
          }
          throw error;
        }
      } else {
        // Load from local file
        console.log(`📥 Loading data from local storage: ${key}`);
        
        // Prevent local file fallback in production
        if (process.env.NODE_ENV === 'production') {
          console.error('❌ Tried to use local fallback in production! This should never happen.');
          return defaultData;
        }
        
        const filePath = path.join(this.localStorageDir, key.endsWith('.json') ? key : `${key}.json`);
        
        if (!fs) {
          throw new Error('fs is not available in production environment');
        }
        if (!fs.existsSync(filePath)) {
          console.log(`⚠️ No data found in local storage for: ${key}, using default`);
          return defaultData;
        }
        
        const jsonString = fs.readFileSync(filePath, 'utf8');
        console.log(`📝 Raw file contents:`, jsonString);
        
        // Special handling for tracks/list.json
        if (key === 'tracks/list.json') {
          // Return the raw string to allow special handling
          console.log(`ℹ️ Returning raw string for tracks/list.json for special handling`);
          return jsonString as unknown as T;
        }
        
        let data: T;
        try {
          data = JSON.parse(jsonString);
          console.log(`✅ Successfully parsed JSON:`, data);
        } catch (parseError) {
          console.error(`❌ Error parsing JSON for ${key}:`, parseError);
          console.log(`⚠️ Raw JSON with issues:`, jsonString);
          console.log(`⚠️ Using default data:`, defaultData);
          return defaultData;
        }
        
        console.log(`✅ Successfully loaded data from local storage: ${key}`);
        return data;
      }
    } catch (error) {
      console.error(`❌ Error loading data (${key}):`, error);
      return defaultData;
    }
  }
}

// Export singleton instance
export const r2Storage = new R2Storage(); 