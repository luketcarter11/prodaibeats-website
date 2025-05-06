# Fixing Cloudflare R2 Audio Playback Issues

We've identified that the audio files stored in Cloudflare R2 are not accessible publicly, which is causing the audio playback to fail on the website. The error is a `401 Unauthorized` when trying to access the audio files through the CDN URL.

## Issue Diagnosis

1. We tested accessing audio files directly through the current CDN URL (https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev) and received 401 Unauthorized errors.
2. This indicates that either:
   - The bucket does not have public access enabled
   - The R2 public bucket URL is incorrectly configured
   - The files are being saved to a different location than expected

## Solution Steps

### 1. Verify R2 Bucket Settings in Cloudflare

1. Log in to your Cloudflare account
2. Navigate to R2 in the dashboard
3. Select your bucket (prodai-beats-storage)
4. Go to "Settings" tab
5. Check the following settings:

   a. **Public Access**: Ensure that public access is enabled for the bucket
   
   b. **Custom Domain/Public Bucket URL**: Verify the public URL for your bucket matches what you have in your `.env` file

### 2. Create a Public Bucket with R2

If the bucket doesn't have public access set up properly:

1. In R2 dashboard, locate your bucket (prodai-beats-storage)
2. Go to "Settings" tab
3. Under "Public Access", enable "Public Access"
4. Note the generated Public Bucket URL (should end with `.r2.dev`)
5. Update your environment variables with this new URL

### 3. Update Your Environment Variables

Make sure your `.env.local` file and Vercel environment variables include:

```
NEXT_PUBLIC_STORAGE_BASE_URL=your-public-bucket-url.r2.dev
```

Replace `your-public-bucket-url.r2.dev` with the actual public bucket URL from Cloudflare.

### 4. Test Access to the Bucket

After making the changes, you can test if the bucket is publicly accessible by:

1. Running the test script we created: `node test-audio-url.js`
2. Manually accessing a file through the browser: `https://your-public-bucket-url.r2.dev/tracks/example.mp3`

### 5. Verify File Structure in the Bucket

Make sure your files are being saved with the correct paths:

1. In the R2 dashboard, check that audio files are stored in the expected location (e.g., `/tracks/track_id.mp3`)
2. If the files are stored in a different location, update the `getR2PublicUrl` function in `src/lib/r2Config.ts`

## Additional Considerations

### Cloudflare Workers or Access Policies

If you need more control over file access, you might want to consider:

1. Setting up Cloudflare Workers to handle authentication for file access
2. Using Access Policies to restrict file access based on specific rules

### CORS Configuration

If you encounter CORS issues when trying to access the files:

1. In the R2 bucket settings, configure CORS to allow access from your domain
2. A minimal CORS configuration example:
   ```json
   [
     {
       "AllowedOrigins": ["https://yourdomain.com"],
       "AllowedMethods": ["GET"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

By following these steps, your audio files should become publicly accessible, and audio playback should work on your website. 