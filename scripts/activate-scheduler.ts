#!/usr/bin/env node

import { getScheduler } from '../src/lib/models/Scheduler'

async function activateScheduler() {
  try {
    console.log('Activating scheduler...')
    const scheduler = await getScheduler()
    const result = await scheduler.toggleActive(true)

    console.log('✅ Scheduler activated')
    console.log(JSON.stringify(result, null, 2))
  } catch (err) {
    console.error('❌ Error activating scheduler:', err)
  }
}

activateScheduler() 