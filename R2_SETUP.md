# Cloudflare R2 Storage Integration

This project uses Cloudflare R2 for storing track audio files and cover images. This document explains how the integration works and how to set it up for your environment.

## Overview

Cloudflare R2 is an S3-compatible object storage service that offers:
- No egress fees for accessing your data
- Amazon S3-compatible API
- Global availability
- Durability and reliability

Our implementation uses the AWS SDK to interact with R2, as R2 is compatible with the S3 API.

## Setup Instructions

### 1. Create a Cloudflare R2 Account

If you haven't already:
1. Sign up for a Cloudflare account
2. Navigate to R2 in the dashboard
3. Create a bucket (we're using `prodai-tracks`)

### 2. Generate API Credentials

1. In the R2 dashboard, go to "Manage R2 API Tokens"
2. Create a new API token with read/write permissions
3. Save your Access Key ID and Secret Access Key

### 3. Environment Variables

Set the following environment variables:

```
R2_ACCESS_KEY_ID=3cb677b9b6722a66a2dc626c404d8c4e
R2_SECRET_ACCESS_KEY=4be2351ef455d794b1675a2fd8b57dfe6044fff21d85713dc9e8355fcdda
R2_ENDPOINT=https://1992471ec8cc523889f80797e15a0529.r2.cloudflarestorage.com
R2_BUCKET=prodai-beats-storage
NEXT_PUBLIC_STORAGE_BASE_URL=https://pub-c059baad842f47laaa2labb935e98d.r2.dev
```

For local development, add these to your `.env.local` file.
For production, add these to your Vercel environment variables.

### 4. Implementation Details

Our implementation includes:

1. `src/lib/r2Uploader.ts` - Core utility for uploading files to R2
2. `src/lib/youtubeTrackImporter.ts` - Implementation for YouTube track imports
3. `src/lib/scheduler/trackImportScheduler.ts` - Scheduler for automated imports

### 5. File Organization in R2

Files are organized in R2 with the following structure:

- `audio/` - Audio files (MP3)
  - `audio/{slug}.mp3` - Individual track audio
- `cover/` - Cover images
  - `cover/{slug}.jpg` - Individual track covers
- `defaults/` - Default resources
  - `defaults/default-cover.jpg` - Default cover image

### 6. Public Access URLs

All uploaded files are set with public read access. The URL format is:

```
https://{account_id}.r2.cloudflarestorage.com/{bucket}/{key}
```

Example:
```
https://1992471ec8cc523889f80797e15a0529.r2.cloudflarestorage.com/prodai-tracks/audio/yt-12345-1234567890.mp3
```

## API Reference

### `uploadFileToR2(filepath, key, contentType?)`

Uploads a file to Cloudflare R2.

- `filepath`: Local file path to upload
- `key`: R2 object key (path within bucket)
- `contentType`: Optional MIME type (auto-detected if not provided)

Returns: Public URL of the uploaded file

### `getR2PublicUrl(key)`

Gets the public URL for an object in R2.

- `key`: R2 object key

Returns: Public URL

## Testing the Integration

You can test the R2 integration by accessing:

```
/api/tracks/upload-test
```

This endpoint will upload a test file (favicon.ico) and return the public URL. 