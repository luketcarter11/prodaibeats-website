import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/lib/supabaseClient' // ✅ Import the shared client

// Log the Supabase client to verify it's properly initialized
console.log('🔄 Supabase client imported in Scheduler.ts:', 
  supabase ? '✅ Client loaded successfully' : '❌ Client is undefined');

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
      console.log('📥 Loading scheduler state from Supabase...')
      
      // Check if supabase client is available
      if (!supabase) {
        console.error('❌ Cannot load state: Supabase client is null')
        this.addLog('Error loading state: Supabase client is not available', 'error')
        return
      }
      
      console.log('🔍 Querying scheduler_state table with no auth restrictions...')
      const { data, error } = await supabase
        .from('scheduler_state')
        .select('json_state')
        .order('updated_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('❌ Error loading scheduler state from Supabase:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          hint: error.hint,
          details: error.details
        })
        console.error('💡 This might be due to RLS policies - make sure RLS is disabled on the scheduler_state table')
        
        // Add to logs if state exists
        if (this.state) {
          this.addLog(`Error loading state: ${error.message}`, 'error')
        }
        return
      }

      console.log('✅ Received data from Supabase:', JSON.stringify(data))

      if (!data || data.length === 0) {
        console.log('ℹ️ No existing state found, using default state')
        this.state = DEFAULT_STATE
        await this.saveState()
        return
      }

      try {
        const stateData = data[0].json_state
        // Handle both string and object formats
        if (typeof stateData === 'string') {
          this.state = JSON.parse(stateData)
        } else {
          this.state = stateData
        }
        console.log('✅ Successfully parsed state:', JSON.stringify(this.state))
      } catch (parseError) {
        console.error('❌ Error parsing JSON state:', parseError)
        this.state = DEFAULT_STATE
        this.addLog(`Error parsing state: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`, 'error')
      }
    } catch (error) {
      console.error('❌ Unexpected error in loadState:', error)
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
      this.addLog(`Unexpected error loading state: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    }
  }

  async saveState(): Promise<boolean> {
    try {
      console.log('📤 Saving scheduler state to Supabase...')
      console.log('State being saved:', JSON.stringify(this.state))
      
      // Check if supabase client is available
      if (!supabase) {
        console.error('❌ Cannot save state: Supabase client is null')
        this.addLog('Error saving state: Supabase client is not available', 'error')
        return false
      }
      
      console.log('💾 Inserting into scheduler_state table with RLS disabled...')
      // Ensure we're inserting a valid object for JSONB, not a string
      const { error } = await supabase
        .from('scheduler_state')
        .insert({ 
          json_state: this.state,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('❌ Error saving scheduler state to Supabase:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          hint: error.hint,
          details: error.details
        })
        console.error('💡 Verify that RLS is disabled on the scheduler_state table in Supabase')
        this.addLog(`Error saving state: ${error.message}`, 'error')
        return false
      }

      console.log('✅ Successfully saved scheduler state')
      return true
    } catch (error) {
      console.error('❌ Unexpected error in saveState:', error)
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
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

    console.log(`📌 Adding new source:`, newSource)
    
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
      ...(sourceId && { sourceId })
    }

    this.state.logs = [log, ...this.state.logs.slice(0, 49)]
  }

  getActiveSources(): SchedulerSource[] {
    return this.state.sources.filter((s) => s.active)
  }

  async updateNextRun() {
    if (!this.state.active) return
    this.state.nextRun = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    await this.saveState()
  }

  async updateSourceLastChecked(id: string) {
    return this.updateSource(id, {
      lastChecked: new Date().toISOString()
    })
  }

  shouldRun(): boolean {
    if (!this.state.active || !this.state.nextRun) return false
    return new Date() >= new Date(this.state.nextRun)
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

// Initialize the scheduler with the state loaded
let scheduler: Scheduler | null = null;
(async () => {
  scheduler = await getScheduler()
})();

// Export the scheduler instance
export { scheduler }
