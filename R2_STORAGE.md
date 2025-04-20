# Cloudflare R2 Storage for Scheduler

This project uses Cloudflare R2 as a storage backend for the scheduler state instead of using the local file system. This approach ensures compatibility with serverless environments like Vercel where the file system is read-only in production.

## Implementation Details

The scheduler state is stored as a JSON file in R2 with the key `scheduler/scheduler.json`. This file contains all the scheduler configuration, including sources, logs, and run schedule.

### R2Storage Class

We've implemented a centralized `R2Storage` class in `src/lib/r2Storage.ts` that handles all R2 operations. It provides methods to:

- Save JSON data to R2 (`save` method)
- Load JSON data from R2 (`load` method)

The class is environment-aware and will:
- In production: Always use R2 storage
- In development: Use R2 if credentials are available, otherwise fall back to in-memory storage

### Configuration

The R2 storage system uses the following environment variables:

- `R2_ACCESS_KEY_ID` - 3cb677b9b6722a66a2dc626c404d8c4e
- `R2_SECRET_ACCESS_KEY` - 4ba2531ef45d5f9d9b1657a252fd8b57dfe6404fff21d85713a3c9e8355cfadd
- `R2_ENDPOINT` - https://1992471ec8cc523889f80797e15a0529.r2.cloudflarestorage.com
- `R2_BUCKET` - prodai-beats-storage

These variables should be set in your environment or in your `.env` file for local development.

## File Structure in R2

```
prodai-tracks/
├── tracks/
│   └── [audio + jpg files]
├── scheduler/
│   └── scheduler.json   ✅
└── test/
    └── test-data.json   (test file)
```

## Advantages

- **Serverless Compatible**: Works in environments where the filesystem is read-only
- **Centralized Storage**: All data is stored in one place (Cloudflare R2)
- **Scalable**: Multiple instances can read/write to the same storage
- **Resilient**: Data persists between deployments

## Testing

You can test the R2 storage implementation by accessing the `/api/scheduler-test` endpoint, which will:

1. Save a test file to R2
2. Load the test file from R2
3. Get the scheduler state from R2 (via the Scheduler class)
4. Return the results to verify everything is working

## Fallback Behavior

If R2 credentials are not available in development, the system will:
- Log warnings about the missing credentials
- Continue operation without actually reading or writing to R2
- Use default values for any data that would normally be read from R2

This allows for development without valid R2 credentials while ensuring correct behavior in production. 