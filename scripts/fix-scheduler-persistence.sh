#!/bin/bash

# Ensure script is executable
chmod +x "$0"

# Function to log messages with timestamps
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check if a process is running
is_running() {
    pgrep -f "tsx src/lib/scheduler-job.ts" > /dev/null
    return $?
}

# Function to start the scheduler
start_scheduler() {
    log "Starting scheduler..."
    
    # Check if we already have a scheduler running
    if is_running; then
        log "Scheduler is already running, stopping it first..."
        stop_scheduler
        sleep 2
    fi
    
    # Activate the scheduler first
    log "Activating scheduler..."
    npm run scheduler:activate
    
    # Start the scheduler in the background
    npm run scheduler:run >> scheduler.log 2>&1 &
    SCHEDULER_PID=$!
    
    # Wait a moment to see if the process is still running
    sleep 5
    if ps -p $SCHEDULER_PID > /dev/null; then
        log "Scheduler started with PID: $SCHEDULER_PID"
        return 0
    else
        log "Scheduler failed to start, check scheduler.log for details"
        return 1
    fi
}

# Function to stop the scheduler
stop_scheduler() {
    if is_running; then
        log "Stopping scheduler..."
        pkill -f "tsx src/lib/scheduler-job.ts"
        sleep 2
        if is_running; then
            log "Force stopping scheduler..."
            pkill -9 -f "tsx src/lib/scheduler-job.ts"
        fi
    fi
}

# Trap SIGTERM and SIGINT
trap 'log "Received shutdown signal..."; stop_scheduler; exit 0' SIGTERM SIGINT

# Main loop
log "Starting scheduler watcher..."
log "Press Ctrl+C to stop"

# Initial start
start_scheduler
START_SUCCESS=$?

# If initial start failed, wait a bit longer before retrying
if [ $START_SUCCESS -ne 0 ]; then
    log "Initial start failed, waiting 60 seconds before retrying..."
    sleep 60
    start_scheduler
fi

# Main monitoring loop
while true; do
    if ! is_running; then
        log "Scheduler not running, starting..."
        start_scheduler
        
        # If start failed, wait a bit longer before retrying
        if [ $? -ne 0 ]; then
            log "Start failed, waiting 60 seconds before retrying..."
            sleep 60
        fi
    fi
    
    # Check if process is still running every 30 seconds
    sleep 30
done 