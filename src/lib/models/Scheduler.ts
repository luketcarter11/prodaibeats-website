import { v4 as uuidv4 } from 'uuid'
import { r2Storage } from '@/lib/r2Storage'

// Log migration notice
console.log('🔄 Scheduler now using Cloudflare R2 for storage')

// R2 storage path for scheduler data
const SCHEDULER_KEY = 'scheduler/scheduler.json'

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

export const DEFAULT_STATE: SchedulerState = {
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
      console.log('📥 Loading scheduler state from R2...')
      
      try {
        // Load state from R2
        this.state = await r2Storage.load<SchedulerState>(SCHEDULER_KEY, DEFAULT_STATE)
        console.log('✅ Successfully loaded state from R2')
      } catch (parseError) {
        console.error('❌ Error loading state from R2:', parseError)
        this.state = DEFAULT_STATE
        this.addLog(`Error loading state: ${parseError instanceof Error ? parseError.message : 'Invalid format'}`, 'error')
        await this.saveState() // Save the default state
      }
    } catch (error) {
      console.error('❌ Unexpected error in loadState:', error)
      this.addLog(`Unexpected error loading state: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    }
  }

  async saveState(): Promise<boolean> {
    try {
      console.log('📤 Saving scheduler state to R2...')
      
      await r2Storage.save(SCHEDULER_KEY, this.state)
      console.log('✅ Successfully saved scheduler state to R2')
      return true
    } catch (error) {
      console.error('❌ Error saving state to R2:', error)
      this.addLog(`Error saving state: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
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
    if (this.state.active) {
      this.state.nextRun = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      await this.saveState()
    }
  }

  async updateSourceLastChecked(id: string) {
    return this.updateSource(id, { lastChecked: new Date().toISOString() })
  }

  shouldRun(): boolean {
    return (
      !!this.state.active &&
      !!this.state.nextRun &&
      new Date() >= new Date(this.state.nextRun)
    )
  }
}

// Singleton instance
let instance: Scheduler | null = null

export const getScheduler = async (): Promise<Scheduler> => {
  if (!instance) {
    instance = new Scheduler()
    await instance.loadState()
  }
  return instance
}

// Export singleton for convenience
export const scheduler = await getScheduler()
