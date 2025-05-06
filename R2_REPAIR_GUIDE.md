# R2 Storage Repair Guide

This guide explains how to use the utilities for fixing issues with the R2 storage system.

## Overview of Issues

There were three main issues with the R2 storage system:

1. **Corrupted tracks/list.json file** - The file contained a malformed array with individual characters instead of proper track IDs.

2. **Frontend audio/cover URLs using the wrong domain** - URLs were using "https://pub-c059baad842f47laaa2labb935e98d.r2.dev" (incorrect) instead of "https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev" (correct).

3. **Metadata files in R2 containing incorrect audio URLs** - The metadata JSON files had URLs with the wrong domain.

## Setting Up Environment Variables

Before running the repair scripts, you must set up your R2 credentials as environment variables:

1. Create a `.env` file in the project root with the following variables:

```
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_ENDPOINT=https://1992471ec8cc523889f80797e15a0529.r2.cloudflarestorage.com
R2_BUCKET=prodai-beats-storage
NEXT_PUBLIC_STORAGE_BASE_URL=https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev
```

2. Replace the placeholder values with your actual R2 credentials.

3. Alternatively, you can set these environment variables in your shell:

```bash
export R2_ACCESS_KEY_ID=your_access_key_id
export R2_SECRET_ACCESS_KEY=your_secret_access_key
export R2_ENDPOINT=https://1992471ec8cc523889f80797e15a0529.r2.cloudflarestorage.com
export R2_BUCKET=prodai-beats-storage
export NEXT_PUBLIC_STORAGE_BASE_URL=https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev
```

## Repair Scripts

The following repair scripts have been created to fix these issues:

### 1. Check R2 Configuration

This script checks your R2 configuration and identifies potential issues with URLs and access.

```bash
npm run r2:check
```

### 2. Repair Tracks List

This script scans all MP3 files in the tracks/ prefix of your R2 bucket, extracts their track IDs, and uploads a proper JSON array to tracks/list.json.

```bash
npm run r2:repair-list
```

### 3. Repair Metadata URLs

This script scans all metadata files in the metadata/ prefix and updates any URLs with the incorrect domain.

```bash
npm run r2:repair-metadata
```

### 4. Run All Repairs

This script runs both repair operations in sequence.

```bash
npm run r2:repair
```

## Running in Production/Non-Interactive Environments

For production environments or CI/CD pipelines, you might need to run these scripts in a non-interactive way. Here are some approaches:

### Using Environment Variables Inline

You can provide the environment variables directly when running the scripts:

```bash
R2_ACCESS_KEY_ID=your_key \
R2_SECRET_ACCESS_KEY=your_secret \
R2_ENDPOINT=your_endpoint \
R2_BUCKET=your_bucket \
NEXT_PUBLIC_STORAGE_BASE_URL=your_cdn_url \
npm run r2:repair
```

### Using a CI/CD Pipeline (e.g., GitHub Actions)

Add the environment variables to your CI/CD secrets and use them in your workflow:

```yaml
name: R2 Storage Repair

on:
  workflow_dispatch:  # Manual trigger

jobs:
  repair:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - name: Run repair scripts
        env:
          R2_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
          R2_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
          R2_ENDPOINT: ${{ secrets.R2_ENDPOINT }}
          R2_BUCKET: ${{ secrets.R2_BUCKET }}
          NEXT_PUBLIC_STORAGE_BASE_URL: ${{ secrets.NEXT_PUBLIC_STORAGE_BASE_URL }}
        run: npm run r2:repair
```

### Using an Environment File in Docker

If you're using Docker, you can use an environment file:

```bash
# Create a .env file with your credentials
echo "R2_ACCESS_KEY_ID=your_key" > .env
echo "R2_SECRET_ACCESS_KEY=your_secret" >> .env
# ... add other variables

# Run in Docker
docker run --env-file .env your-docker-image npm run r2:repair
```

## How the Repairs Work

### tracks/list.json Repair

1. Lists all .mp3 files in the tracks/ prefix
2. Extracts clean track IDs from the filenames
3. Creates a proper JSON array with the track IDs
4. Uploads this array to tracks/list.json

### Metadata URLs Repair

1. Lists all .json files in the metadata/ prefix
2. For each file, checks for the incorrect domain in audioUrl and coverUrl
3. If found, replaces with the correct domain
4. Uploads the fixed metadata file back to R2

## Preventative Measures

The `youtubeTrackImporter.ts` file has been updated to ensure it uses the correct domain and paths:

1. URLs are always generated using `getR2PublicUrl()` from r2Config.ts
2. Additional validation is performed to ensure URLs start with the correct domain
3. If an incorrect URL is detected, it's forcibly corrected before upload

## Troubleshooting

If you encounter issues after running the repairs:

1. Check your environment variables:
   - NEXT_PUBLIC_STORAGE_BASE_URL should be set to "https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev"
   - R2_BUCKET should be set to your bucket name
   - R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY should be set to valid credentials

2. Run the check script to diagnose issues:
   ```bash
   npm run r2:check
   ```

3. Check the logs in the console for specific errors or warnings

4. Verify that the tracks/list.json file contains a proper array of track IDs

## Common Errors

### "Resolved credential object is not valid"

This error occurs when the R2 credentials (access key and secret key) are not properly set as environment variables. Make sure to:

1. Create a `.env` file with your credentials
2. Check that the credentials are valid
3. Restart your terminal or application after setting the variables

### "Access Denied" or 403 errors

This could be due to:
1. Incorrect bucket name
2. Permissions issues with your R2 credentials
3. Incorrect R2 endpoint

Run `npm run r2:check` to verify your configuration.

## Technical Implementation

All repair scripts are implemented in TypeScript and use the AWS SDK to interact with the R2 storage:

- `src/lib/repair-list-json.ts` - Implementation for repairing the tracks list
- `src/lib/repair-metadata-urls.ts` - Implementation for repairing metadata URLs
- `src/lib/check-r2-urls.ts` - Implementation for checking R2 configuration

The root directory contains wrapper scripts that import these implementations.

## Future Improvements

- Add automated tests to verify correct URL formats
- Implement a validation process for new tracks before they are uploaded
- Create monitoring to detect and alert when issues occur 