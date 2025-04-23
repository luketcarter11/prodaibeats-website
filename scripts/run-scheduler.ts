import { runSchedulerNow } from '../src/lib/scheduler-job'

async function main() {
  try {
    console.log('🚀 Starting scheduler run...')
    await runSchedulerNow()
    console.log('✅ Scheduler run completed successfully')
  } catch (error) {
    console.error('❌ Error running scheduler:', error)
    process.exit(1)
  }
}

// Run the script
main() 