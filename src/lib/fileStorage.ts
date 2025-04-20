import fs from 'fs';
import path from 'path';

/**
 * File-based storage system for saving application state to JSON files
 */
export class FileStorage {
  private basePath: string;

  constructor() {
    // Use the data directory at the root of the project
    this.basePath = path.join(process.cwd(), 'data');
    
    // Ensure the directory exists
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  /**
   * Save data to a JSON file
   * @param filename Name of the file (without extension)
   * @param data Data to save (will be serialized to JSON)
   * @returns Promise that resolves when the data is saved
   */
  async save(filename: string, data: any): Promise<void> {
    try {
      const filePath = path.join(this.basePath, `${filename}.json`);
      await fs.promises.writeFile(
        filePath, 
        JSON.stringify(data, null, 2),
        'utf8'
      );
      return;
    } catch (error) {
      console.error(`Error saving ${filename}.json:`, error);
      throw new Error(`Failed to save data to ${filename}.json`);
    }
  }

  /**
   * Load data from a JSON file
   * @param filename Name of the file (without extension)
   * @param defaultData Default data to return if file doesn't exist
   * @returns Promise that resolves with the parsed data
   */
  async load<T>(filename: string, defaultData: T): Promise<T> {
    try {
      const filePath = path.join(this.basePath, `${filename}.json`);
      
      if (!fs.existsSync(filePath)) {
        return defaultData;
      }
      
      const rawData = await fs.promises.readFile(filePath, 'utf8');
      return JSON.parse(rawData) as T;
    } catch (error) {
      console.error(`Error loading ${filename}.json:`, error);
      return defaultData;
    }
  }
}

// Singleton instance
export const fileStorage = new FileStorage(); 