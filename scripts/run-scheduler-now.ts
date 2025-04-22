#!/usr/bin/env node

import { runSchedulerNow } from '../src/lib/scheduler-job'

async function main() {
  try {
    console.log('🚀 Running scheduler immediately...')
    await runSchedulerNow()
    console.log('✅ Scheduler run completed')
  } catch (error) {
    console.error('❌ Error running scheduler:', error)
    process.exit(1)
  }
}

main() 