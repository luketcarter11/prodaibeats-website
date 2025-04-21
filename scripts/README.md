# Scheduler Scripts

This directory contains scripts for managing the track download scheduler.

## Available Scripts

### `update-scheduler.mjs`

Updates the scheduler state to run immediately. This script is used to trigger the scheduler to check for new tracks.

```bash
npx tsx scripts/update-scheduler.mjs
```

### `watch-scheduler.sh`

A shell script that periodically runs the scheduler to check for and download new tracks. It runs the scheduler every 10 minutes by default.

#### Usage

```bash
# Make the script executable (only needed once)
chmod +x scripts/watch-scheduler.sh

# Run in the foreground (for testing)
./scripts/watch-scheduler.sh

# Run in the background (for production)
nohup ./scripts/watch-scheduler.sh > scheduler.log 2>&1 &
```

#### Configuration

You can modify the following variables in the script to customize its behavior:

- `LOG_FILE`: The file to log output to (default: "scheduler.log")
- `SLEEP_INTERVAL`: How long to wait between runs in seconds (default: 600, which is 10 minutes)
- `MAX_RETRIES`: Maximum number of retry attempts if the scheduler fails (default: 3)
- `RETRY_DELAY`: How long to wait between retry attempts in seconds (default: 60)

## Troubleshooting

If the scheduler is not running as expected:

1. Check the log file for errors:
   ```bash
   tail -f scheduler.log
   ```

2. Verify that the scheduler is running:
   ```bash
   ps aux | grep watch-scheduler
   ```

3. Restart the scheduler:
   ```bash
   # Find the process ID
   ps aux | grep watch-scheduler
   
   # Kill the process
   kill <PID>
   
   # Start it again
   nohup ./scripts/watch-scheduler.sh > scheduler.log 2>&1 &
   ``` 