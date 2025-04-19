# Fixing Vercel Deployment Size Limits

## Problem

The deployment is failing because the serverless functions are exceeding Vercel's size limit of 250MB. This is due to the inclusion of audio files (MP3s) in the deployment bundle.

From the deployment logs:
```
Warning: Max serverless function size of 250 MB uncompressed reached
Serverless Function's page: api/tracks/add.js
```

Total size of dependencies: 863.47 MB (far above the 250MB limit)

## Solution

### 1. Move Audio Files to External Storage

Audio files should be hosted on a dedicated cloud storage service instead of being included in the deployment:

- Use a service like AWS S3, Google Cloud Storage, or Cloudinary
- Upload all MP3 files from the `tracks` directory to your chosen storage service
- Update your application to reference the externally hosted files

### 2. Update Track References

The code has been updated to use external URLs for track references:

- Updated `app/api/tracks/route.ts` to use external URLs
- Updated `src/lib/data.ts` to handle external file paths
- Added entries to `.vercelignore` to exclude audio files from deployment

### 3. Implementation Steps

1. Sign up for a cloud storage service (AWS S3 recommended)
2. Upload your audio files to a bucket with this structure:
   ```
   your-bucket/
     ├── prodai-beats/
         ├── audio/
         │   ├── track1.mp3
         │   ├── track2.mp3
         │   └── ...
         └── images/
             ├── tracks/
             │   ├── track1.jpg
             │   └── ...
             └── covers/
                 └── ...
   ```
3. Make all files publicly accessible or use signed URLs
4. Replace the placeholder URLs in the code with your actual bucket URLs
5. Redeploy to Vercel

### 4. Environment Configuration

Consider using environment variables for storage URLs:

```
NEXT_PUBLIC_STORAGE_BASE_URL=https://your-bucket.s3.amazonaws.com/prodai-beats
```

Then update your code to use:
```javascript
const imageUrl = `${process.env.NEXT_PUBLIC_STORAGE_BASE_URL}/images/tracks/${track.slug}.jpg`;
const audioUrl = `${process.env.NEXT_PUBLIC_STORAGE_BASE_URL}/audio/${track.slug}.mp3`;
```

This will make it easier to manage different environments. 