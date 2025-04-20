import fs from 'fs';
import path from 'path';
import { importTrackFromYoutube, importTracksFromSource } from '../youtubeTrackImporter';

// Define scheduler state type
interface SchedulerState {
  active: boolean;
  nextRun: string | null;  // ISO string
  sources: SourceConfig[];
  logs: LogEntry[];
}

// Define source configuration
interface SourceConfig {
  id: string;
  url: string;
  type: 'channel' | 'playlist' | 'video';
  name: string;
  lastChecked?: string;  // ISO string
  enabled: boolean;
  limit?: number;
}

// Define log entry
interface LogEntry {
  timestamp: string;  // ISO string
  message: string;
  level: 'info' | 'warning' | 'error';
  source?: string;
}

// Scheduler class for managing track imports
export class TrackImportScheduler {
  private state: SchedulerState;
  private stateFilePath: string;
  
  constructor() {
    this.stateFilePath = path.join(process.cwd(), 'data', 'scheduler-state.json');
    this.state = this.loadState();
  }
  
  /**
   * Load scheduler state from file
   */
  private loadState(): SchedulerState {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.stateFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Load state if exists
      if (fs.existsSync(this.stateFilePath)) {
        const data = fs.readFileSync(this.stateFilePath, 'utf8');
        const state = JSON.parse(data);
        console.log('Scheduler state loaded successfully');
        return state;
      }
      
      // Default state
      console.log('No existing state found, using default state');
      return {
        active: false,
        nextRun: null,
        sources: [],
        logs: []
      };
    } catch (error) {
      console.error('Error loading scheduler state:', error);
      
      // Return default state on error
      return {
        active: false,
        nextRun: null,
        sources: [],
        logs: []
      };
    }
  }
  
  /**
   * Save scheduler state to file
   */
  private saveState(): void {
    try {
      // Ensure directory exists
      const dataDir = path.dirname(this.stateFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Write state to file
      fs.writeFileSync(this.stateFilePath, JSON.stringify(this.state, null, 2));
      console.log('Scheduler state saved successfully');
    } catch (error) {
      console.error('Error saving scheduler state:', error);
    }
  }
  
  /**
   * Add a log entry
   */
  private addLog(message: string, level: 'info' | 'warning' | 'error', source?: string): void {
    this.state.logs.unshift({
      timestamp: new Date().toISOString(),
      message,
      level,
      source
    });
    
    // Trim logs to last 100 entries
    if (this.state.logs.length > 100) {
      this.state.logs = this.state.logs.slice(0, 100);
    }
    
    // Save state
    this.saveState();
  }
  
  /**
   * Toggle scheduler active state
   */
  public toggleActive(): boolean {
    this.state.active = !this.state.active;
    
    if (this.state.active) {
      // Set next run to now if activating
      this.state.nextRun = new Date().toISOString();
      this.addLog('Scheduler activated', 'info');
    } else {
      this.addLog('Scheduler deactivated', 'info');
    }
    
    this.saveState();
    return this.state.active;
  }
  
  /**
   * Add a new source
   */
  public addSource(source: Omit<SourceConfig, 'id'>): SourceConfig {
    const id = `source_${Date.now()}`;
    const newSource: SourceConfig = {
      ...source,
      id,
      enabled: true
    };
    
    this.state.sources.push(newSource);
    this.addLog(`Added new source: ${source.name} (${source.url})`, 'info');
    this.saveState();
    
    return newSource;
  }
  
  /**
   * Remove a source
   */
  public removeSource(sourceId: string): boolean {
    const initialLength = this.state.sources.length;
    this.state.sources = this.state.sources.filter(s => s.id !== sourceId);
    
    if (this.state.sources.length < initialLength) {
      this.addLog(`Removed source with ID: ${sourceId}`, 'info');
      this.saveState();
      return true;
    }
    
    return false;
  }
  
  /**
   * Get scheduler status
   */
  public getStatus() {
    return {
      active: this.state.active,
      nextRun: this.state.nextRun,
      sourceCount: this.state.sources.length,
      recentLogs: this.state.logs.slice(0, 5)
    };
  }
  
  /**
   * Get all sources
   */
  public getSources() {
    return [...this.state.sources];
  }
  
  /**
   * Get recent logs
   */
  public getLogs(limit = 20) {
    return this.state.logs.slice(0, limit);
  }
  
  /**
   * Run the scheduler manually
   */
  public async runNow(): Promise<{ success: boolean; imported: number; errors: number }> {
    try {
      this.addLog('Manual scheduler run started', 'info');
      
      const enabledSources = this.state.sources.filter(s => s.enabled);
      let imported = 0;
      let errors = 0;
      
      for (const source of enabledSources) {
        try {
          this.addLog(`Processing source: ${source.name}`, 'info', source.id);
          
          // For single videos
          if (source.type === 'video') {
            // Extract video ID from URL
            const videoId = extractVideoId(source.url);
            if (!videoId) {
              this.addLog(`Invalid YouTube video URL: ${source.url}`, 'error', source.id);
              errors++;
              continue;
            }
            
            // Import the track
            const track = await importTrackFromYoutube(videoId, source.url);
            
            if (track) {
              imported++;
              this.addLog(`Successfully imported track: ${track.title}`, 'info', source.id);
            } else {
              errors++;
              this.addLog(`Failed to import video: ${videoId}`, 'error', source.id);
            }
          } 
          // For channels and playlists
          else {
            const limit = source.limit || 5;
            const tracks = await importTracksFromSource(source.url, limit);
            
            imported += tracks.length;
            
            if (tracks.length > 0) {
              this.addLog(`Imported ${tracks.length} tracks from ${source.name}`, 'info', source.id);
            } else {
              this.addLog(`No new tracks found from ${source.name}`, 'info', source.id);
            }
          }
          
          // Update last checked time
          source.lastChecked = new Date().toISOString();
        } catch (error) {
          errors++;
          this.addLog(`Error processing source ${source.name}: ${error}`, 'error', source.id);
        }
      }
      
      // Set next run if scheduler is active
      if (this.state.active) {
        // Set next run to 1 hour from now
        const nextRun = new Date();
        nextRun.setHours(nextRun.getHours() + 1);
        this.state.nextRun = nextRun.toISOString();
      }
      
      this.addLog(`Scheduler run completed: ${imported} tracks imported, ${errors} errors`, 'info');
      this.saveState();
      
      return { success: true, imported, errors };
    } catch (error) {
      this.addLog(`Scheduler run failed: ${error}`, 'error');
      this.saveState();
      return { success: false, imported: 0, errors: 1 };
    }
  }
}

/**
 * Extract YouTube video ID from URL
 */
function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // youtube.com/watch?v=ID format
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.includes('/watch')) {
      return urlObj.searchParams.get('v');
    }
    
    // youtu.be/ID format
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.substring(1);
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Export a singleton instance
export const scheduler = new TrackImportScheduler(); 