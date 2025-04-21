#!/bin/bash

# Configuration
LOG_FILE="scheduler.log"
SLEEP_INTERVAL=600  # 10 minutes in seconds
MAX_RETRIES=3
RETRY_DELAY=60      # 60 seconds between retries

# Logging function
log() {
  local message="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  echo "$message" | tee -a "$LOG_FILE"
}

# Error handling
handle_error() {
  log "❌ ERROR: $1"
  return 1
}

# Run scheduler with retries
run_scheduler() {
  local retries=0
  
  while [ $retries -lt $MAX_RETRIES ]; do
    log "🔄 Updating scheduler to run immediately (attempt $((retries+1))/$MAX_RETRIES)..."
    
    if npx tsx scripts/update-scheduler.mjs; then
      log "✅ Scheduler updated successfully"
      
      log "🚀 Running scheduler job..."
      if npm run scheduler:run-now; then
        log "✅ Scheduler job completed successfully"
        return 0
      else
        log "⚠️ Scheduler job failed"
      fi
    else
      log "⚠️ Failed to update scheduler"
    fi
    
    retries=$((retries+1))
    
    if [ $retries -lt $MAX_RETRIES ]; then
      log "⏳ Waiting $RETRY_DELAY seconds before retrying..."
      sleep $RETRY_DELAY
    fi
  done
  
  handle_error "Failed to run scheduler after $MAX_RETRIES attempts"
  return 1
}

# Trap Ctrl+C and other termination signals
trap 'log "Received shutdown signal. Exiting..."; exit 0' SIGINT SIGTERM

# Main execution
log "⏱️  Starting scheduler watcher..."

# Initial run
run_scheduler

# Main loop
while true; do
  log "⏳ Sleeping for $SLEEP_INTERVAL seconds..."
  sleep $SLEEP_INTERVAL
  
  run_scheduler
done 