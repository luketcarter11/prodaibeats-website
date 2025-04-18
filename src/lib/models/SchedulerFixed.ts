import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/lib/supabaseClient'
import fs from 'fs'
import path from 'path'

// Define file path for local storage
const SCHEDULER_STATE_FILE = path.join(process.cwd(), 'data', 'scheduler.json')

export interface SchedulerSource {
  id: string
  source: string
  type: 'channel' | 'playlist'
  lastChecked: string | null
  active: boolean
}

export interface SchedulerLog {
  timestamp: string
  message: string
  sourceId?: string
  type: 'info' | 'success' | 'error'
}

export interface SchedulerState {
  active: boolean
  nextRun: string | null
  sources: SchedulerSource[]
  logs: SchedulerLog[]
}

// Define the default state for new schedulers
const DEFAULT_STATE: SchedulerState = {
  active: false,
  nextRun: null,
  sources: [],
  logs: []
}

export class Scheduler {
  private state: SchedulerState = DEFAULT_STATE

  constructor() {}

  async loadState(): Promise<void> {
    try {
      console.log('📥 Loading scheduler state...')
      
      // Try to load from local file first
      try {
        console.log(`Checking for local file at ${SCHEDULER_STATE_FILE}`)
        if (fs.existsSync(SCHEDULER_STATE_FILE)) {
          console.log('💾 Local file exists, loading...')
          const fileContent = fs.readFileSync(SCHEDULER_STATE_FILE, 'utf8')
          
          try {
            this.state = JSON.parse(fileContent)
            console.log('✅ Successfully loaded state from local file')
            return
          } catch (parseError) {
            console.error('❌ Error parsing local file:', parseError)
            this.addLog(`Error parsing local file: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`, 'error')
          }
        } else {
          console.log('❌ Local file not found')
        }
      } catch (fsError) {
        console.error('❌ Error accessing filesystem:', fsError)
      }
      
      // Fallback to Supabase (legacy method)
      console.log('🔄 Falling back to Supabase...')
      
      // Check if supabase client is available
      if (!supabase) {
        console.error('❌ Cannot load state: Supabase client is null')
        this.addLog('Error loading state: Supabase client is not available', 'error')
        
        // Use default state and save it locally
        this.state = DEFAULT_STATE
        await this.saveState()
        return
      }
      
      try {
        console.log('🔍 Querying scheduler_state table...')
        const { data, error } = await supabase
          .from('scheduler_state')
          .select('json_state')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) {
          console.error('❌ Error loading from Supabase:', error)
          
          // Add to logs if state exists
          if (this.state) {
            this.addLog(`Error loading state from Supabase: ${error.message}`, 'error')
          }
          
          // Use default state and save it locally
          this.state = DEFAULT_STATE
          await this.saveState()
          return
        }

        if (data?.json_state) {
          try {
            // Handle both string and object formats
            if (typeof data.json_state === 'string') {
              this.state = JSON.parse(data.json_state)
            } else {
              this.state = data.json_state
            }
            console.log('✅ Successfully loaded state from Supabase')
            
            // Save to local file for future use
            await this.saveState()
          } catch (parseError) {
            console.error('❌ Error parsing JSON from Supabase:', parseError)
            this.state = DEFAULT_STATE
            this.addLog(`Error parsing state from Supabase: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`, 'error')
            await this.saveState()
          }
        } else {
          console.log('ℹ️ No existing state found in Supabase, using default')
          this.state = DEFAULT_STATE
          await this.saveState()
        }
      } catch (supabaseError) {
        console.error('❌ Unexpected Supabase error:', supabaseError)
        
        // Use default state and save it locally
        this.state = DEFAULT_STATE
        await this.saveState()
      }
    } catch (error) {
      console.error('❌ Unexpected error in loadState:', error)
      this.addLog(`Unexpected error loading state: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
      
      // Use default state as last resort
      this.state = DEFAULT_STATE
    }
  }

  async saveState(): Promise<boolean> {
    try {
      console.log('📤 Saving scheduler state...')
      
      // Always try to save to local file first
      try {
        console.log(`Saving to local file at ${SCHEDULER_STATE_FILE}`)
        
        // Ensure data directory exists
        const dir = path.dirname(SCHEDULER_STATE_FILE)
        if (!fs.existsSync(dir)) {
          console.log(`Creating directory: ${dir}`)
          fs.mkdirSync(dir, { recursive: true })
        }
        
        // Write state to file
        fs.writeFileSync(
          SCHEDULER_STATE_FILE, 
          JSON.stringify(this.state, null, 2)
        )
        console.log('✅ Successfully saved state to local file')
        
        // If local save succeeded, we can return success
        return true
      } catch (fsError) {
        console.error('❌ Error saving to local file:', fsError)
      }
      
      // Fallback to Supabase (legacy method)
      console.log('🔄 Falling back to Supabase...')
      
      // Check if supabase client is available
      if (!supabase) {
        console.error('❌ Cannot save state: Supabase client is null')
        this.addLog('Error saving state: Supabase client is not available', 'error')
        return false
      }
      
      try {
        console.log('💾 Inserting into scheduler_state table...')
        const { error } = await supabase
          .from('scheduler_state')
          .insert({ 
            json_state: this.state,
            updated_at: new Date().toISOString()
          })

        if (error) {
          console.error('❌ Error saving to Supabase:', error)
          this.addLog(`Error saving state to Supabase: ${error.message}`, 'error')
          return false
        }

        console.log('✅ Successfully saved state to Supabase')
        return true
      } catch (supabaseError) {
        console.error('❌ Unexpected Supabase error:', supabaseError)
        this.addLog(`Unexpected error saving to Supabase: ${supabaseError instanceof Error ? supabaseError.message : 'Unknown error'}`, 'error')
        return false
      }
    } catch (error) {
      console.error('❌ Unexpected error in saveState:', error)
      this.addLog(`Unexpected error saving state: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
      return false
    }
  }

  getState(): SchedulerState {
    return this.state
  }

  getStatus() {
    return {
      active: this.state.active,
      nextRun: this.state.nextRun,
      interval: '24 hours',
      sources: this.state.sources,
      logs: this.state.logs
    }
  }

  async toggleActive(active: boolean) {
    this.state.active = active
    this.state.nextRun = active
      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      : null

    this.addLog(`Scheduler ${active ? 'activated' : 'paused'}`, 'info')
    const success = await this.saveState()
    
    if (!success) {
      console.error('❌ Failed to save state after toggling active status')
    }

    return {
      active: this.state.active,
      nextRun: this.state.nextRun
    }
  }

  async addSource(sourceData: { source: string; type: 'channel' | 'playlist' }) {
    const newSource: SchedulerSource = {
      id: uuidv4(),
      source: sourceData.source,
      type: sourceData.type,
      lastChecked: null,
      active: true
    }
    
    this.state.sources.push(newSource)
    this.addLog(`Added new ${sourceData.type}: ${sourceData.source}`, 'success')
    
    const success = await this.saveState()
    if (!success) {
      console.error('❌ Failed to save state after adding source')
    }
    
    return newSource
  }

  async updateSource(id: string, updates: Partial<SchedulerSource>) {
    const index = this.state.sources.findIndex((s) => s.id === id)
    if (index === -1) return null

    this.state.sources[index] = { ...this.state.sources[index], ...updates }
    this.addLog(`Updated source: ${this.state.sources[index].source}`, 'info', id)
    
    const success = await this.saveState()
    if (!success) {
      console.error('❌ Failed to save state after updating source')
    }
    
    return this.state.sources[index]
  }

  async deleteSource(id: string) {
    const index = this.state.sources.findIndex((s) => s.id === id)
    if (index === -1) return false

    const source = this.state.sources[index]
    this.state.sources.splice(index, 1)
    this.addLog(`Deleted source: ${source.source}`, 'info')
    
    const success = await this.saveState()
    if (!success) {
      console.error('❌ Failed to save state after deleting source')
    }
    
    return true
  }

  addLog(message: string, type: 'info' | 'success' | 'error', sourceId?: string) {
    const log: SchedulerLog = {
      timestamp: new Date().toISOString(),
      message,
      type,
      ...(sourceId ? { sourceId } : {})
    }

    this.state.logs.unshift(log)
    
    // Keep only the last 100 logs
    if (this.state.logs.length > 100) {
      this.state.logs = this.state.logs.slice(0, 100)
    }
    
    return log
  }

  getActiveSources(): SchedulerSource[] {
    return this.state.sources.filter((s) => s.active)
  }

  async updateNextRun() {
    this.state.nextRun = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    await this.saveState()
  }

  async updateSourceLastChecked(id: string) {
    const index = this.state.sources.findIndex((s) => s.id === id)
    if (index !== -1) {
      this.state.sources[index].lastChecked = new Date().toISOString()
      await this.saveState()
    }
  }

  shouldRun(): boolean {
    if (!this.state.active) return false
    if (!this.state.nextRun) return false
    
    const nextRun = new Date(this.state.nextRun)
    return new Date() >= nextRun
  }
}

let schedulerInstance: Scheduler | null = null

export const getScheduler = async (): Promise<Scheduler> => {
  if (!schedulerInstance) {
    schedulerInstance = new Scheduler()
    await schedulerInstance.loadState()
  }
  
  return schedulerInstance
} 