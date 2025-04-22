# Deploying to Vercel

This guide provides step-by-step instructions for deploying the ProdAI Beats store to Vercel.

## Prerequisites

- A Vercel account
- A GitHub repository with your codebase
- Cloudflare R2 bucket configured with proper access credentials
- CDN for hosting audio and image files

## Step 1: Prepare Your Environment Variables

Make sure you have the following environment variables ready:

- `R2_ACCESS_KEY_ID` - Your Cloudflare R2 access key
- `R2_SECRET_ACCESS_KEY` - Your Cloudflare R2 secret key
- `R2_ENDPOINT` - Your Cloudflare R2 endpoint URL
- `R2_BUCKET` - Your Cloudflare R2 bucket name
- `NEXT_PUBLIC_STORAGE_BASE_URL` - URL to your CDN (e.g., 'https://cdn.prodaibeats.com')
- `NODE_ENV` - Set to 'production' for production builds

## Step 2: Connect to Vercel

1. Go to [Vercel](https://vercel.com) and sign in to your account
2. Click "Add New..." and select "Project"
3. Select your GitHub repository
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: .next

## Step 3: Configure Environment Variables

1. In the Vercel project settings, go to the "Environment Variables" section
2. Add all the required environment variables mentioned in Step 1
3. Make sure to add them to all environments (Production, Preview, Development)

## Step 4: Deploy

1. Click "Deploy" to start the deployment process
2. Wait for the build and deployment to complete
3. Once deployed, Vercel will provide you with a URL to access your site

## Step 5: Verify Deployment

1. Visit the deployed URL and check if the website loads properly
2. Navigate to the `/beats` page to verify that tracks are displayed correctly
3. Test the audio player to ensure that tracks play correctly
4. Check the `/api/debug` endpoint for diagnostic information

## Troubleshooting

If you encounter issues after deployment:

1. Check the Vercel logs for any build or runtime errors
2. Verify that all environment variables are set correctly
3. Ensure that your R2 credentials have the proper permissions
4. Check if the CDN URLs are correct and accessible
5. Use the `/api/debug` endpoint to get diagnostic information

## Monitoring

After deployment, monitor the following:

1. Server logs for any R2 connection issues
2. "No tracks found" errors in the console
3. Missing metadata or audio files
4. CDN access issues

## Notes

- The application uses Cloudflare R2 for storing track metadata
- Audio and image files are served from a CDN
- The application has robust error handling for metadata parsing and audio playback
- The debug API endpoint is available at `/api/debug` for diagnostics 