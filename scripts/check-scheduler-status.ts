#!/usr/bin/env node

import { getScheduler } from '../src/lib/models/Scheduler'

async function checkSchedulerStatus() {
  try {
    console.log('🔍 Checking scheduler status...')
    
    const scheduler = await getScheduler()
    const state = scheduler.getState()
    
    console.log('\n📊 Scheduler Status:')
    console.log(`Active: ${state.active ? '✅ Yes' : '❌ No'}`)
    console.log(`Next Run: ${state.nextRun ? new Date(state.nextRun).toLocaleString() : 'Not scheduled'}`)
    console.log(`Sources: ${state.sources.length}`)
    console.log(`Logs: ${state.logs.length}`)
    
    if (state.sources.length > 0) {
      console.log('\n📌 Sources:')
      state.sources.forEach((source, index) => {
        console.log(`${index + 1}. ${source.source} (${source.type}) - ${source.active ? 'Active' : 'Inactive'}`)
        console.log(`   Last Checked: ${source.lastChecked ? new Date(source.lastChecked).toLocaleString() : 'Never'}`)
      })
    }
    
    if (state.logs.length > 0) {
      console.log('\n📝 Recent Logs:')
      state.logs.slice(0, 5).forEach((log, index) => {
        const timestamp = new Date(log.timestamp).toLocaleString()
        const source = log.sourceId ? state.sources.find(s => s.id === log.sourceId)?.source : 'N/A'
        console.log(`${index + 1}. [${timestamp}] [${log.type.toUpperCase()}] ${log.message} ${source !== 'N/A' ? `(Source: ${source})` : ''}`)
      })
    }
    
    console.log('\n🔍 Should Run Now:', scheduler.shouldRun() ? '✅ Yes' : '❌ No')
  } catch (error) {
    console.error('❌ Error checking scheduler status:', error)
  }
}

checkSchedulerStatus() 