# Scheduler File Storage Implementation

After migrating from Supabase to local file storage, the scheduler now stores its state in a local JSON file. This document explains how the scheduler storage works and how to fix any issues.

## Current Implementation

The scheduler state is now stored in a local JSON file at:

```
data/scheduler.json
```

This file contains:

- Active state (true/false)
- Next run time (ISO date string)
- Sources (YouTube channels/playlists)
- Logs (activity history)

## How It Works

1. The `Scheduler` class attempts to load state from the local file first
2. If the file doesn't exist or is corrupted, it falls back to Supabase (legacy method)
3. If both methods fail, it initializes with a default state
4. All saves are written to the local file

## Troubleshooting

If you're experiencing issues with the scheduler:

### Empty State or Missing File

If `scheduler.json` is missing or empty:

```bash
# Run this script to create a properly formatted scheduler file
node scripts/create-local-scheduler.js
```

### Scheduler Not Running

1. Check if the scheduler is active:
   ```bash
   # This will show the current state including active status
   node scripts/check-scheduler-file.js
   ```

2. Verify the cron job is set up correctly (see `SCHEDULER_SETUP.md`)

3. Check that the Next.js API route for the cron job is accessible:
   ```
   https://your-domain.com/api/cron/scheduler?key=YOUR_CRON_SECRET_KEY
   ```

### Fixing a Corrupted File

If the scheduler file is corrupted:

1. Back up the current file:
   ```bash
   cp data/scheduler.json data/scheduler.json.bak
   ```

2. Create a fresh file:
   ```bash
   node scripts/create-local-scheduler.js
   ```

## Developer Notes

The improved scheduler implementation in `src/lib/models/SchedulerFixed.ts` provides:

1. Enhanced local file storage
2. Detailed logging
3. Fallback to Supabase if needed
4. Better error handling

To use this implementation, rename it to replace the current one:

```bash
# Backup current implementation
mv src/lib/models/Scheduler.ts src/lib/models/Scheduler.ts.old

# Use the fixed implementation
mv src/lib/models/SchedulerFixed.ts src/lib/models/Scheduler.ts
```

## Testing

You can test the scheduler implementation by:

1. Creating a test scheduler file:
   ```bash
   node scripts/create-local-scheduler.js
   ```

2. Verifying scheduler state:
   ```bash
   node scripts/check-scheduler-file.js
   ```

3. Triggering the scheduler manually:
   ```bash
   node -e "require('./src/lib/scheduler-job').runSchedulerNow()"
   ```

## File Format

The scheduler JSON file follows this format:

```json
{
  "active": true,
  "nextRun": "2025-04-19T00:00:00.000Z",
  "sources": [
    {
      "id": "uuid-string",
      "source": "https://www.youtube.com/channel/CHANNEL_ID",
      "type": "channel",
      "lastChecked": "2025-04-18T00:00:00.000Z",
      "active": true
    }
  ],
  "logs": [
    {
      "timestamp": "2025-04-18T00:00:00.000Z",
      "message": "Scheduler activated",
      "type": "info"
    }
  ]
}
``` 