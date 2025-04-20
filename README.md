# ProdAI Beats

A music marketplace for beats with YouTube Music integration and automatic metadata extraction.

## Deployment Guide

### Deploying to Vercel

1. **Prepare Your Repository**
   - Make sure your repository is pushed to GitHub
   - Ensure all dependencies are properly listed in package.json
   - Verify your project builds locally with `npm run build`

2. **Create a Vercel Account**
   - Sign up at [vercel.com](https://vercel.com) if you don't have an account
   - You can sign up using your GitHub account for easy integration

3. **Deploy to Vercel**
   - Method 1: Using the Vercel Dashboard
     - Go to your Vercel dashboard
     - Click "New Project"
     - Import your GitHub repository
     - Configure project settings (build commands should be auto-detected)
     - Deploy

   - Method 2: Using Vercel CLI
     ```bash
     # Install Vercel CLI
     npm install -g vercel
     
     # Login to Vercel
     vercel login
     
     # Deploy from your project directory
     cd /path/to/prodaibeats.com
     vercel
     ```

4. **Set Environment Variables**
   - In the Vercel dashboard, go to your project settings
   - Navigate to the "Environment Variables" tab
   - Add the following variables:
     - `NEXT_PUBLIC_SITE_URL`: Your production URL
     - `CRON_SECRET_KEY`: A secure random string for scheduler auth
   - Save and redeploy if necessary

### Connecting Your GoDaddy Domain

1. **Add Your Domain in Vercel**
   - In your Vercel project, go to "Settings" > "Domains"
   - Add your domain (e.g., prodaibeats.com)
   - Vercel will provide nameserver information

2. **Update DNS Settings in GoDaddy**
   - Log in to your GoDaddy account
   - Navigate to your domain's DNS settings
   - Choose "Change nameservers"
   - Select "Custom" and enter the Vercel nameservers:
     ```
     ns1.vercel-dns.com
     ns2.vercel-dns.com
     ```
   - Save changes

3. **Alternative: Using GoDaddy DNS with Vercel**
   - If you prefer to keep GoDaddy's DNS:
     - In Vercel, copy the provided DNS verification record
     - In GoDaddy, add this as a TXT record
     - In GoDaddy, add A records pointing to Vercel's IP addresses
     - Add CNAME records for www subdomain

4. **Verify Domain Connection**
   - Domain propagation may take up to 48 hours
   - Check status in the Vercel dashboard
   - Test your domain to ensure it's properly connected

### Configuring Scheduler for YouTube Integration

1. **Setup Cron Job**
   - Sign up at [cron-job.org](https://cron-job.org)
   - Create a new cron job pointing to your scheduler endpoint:
     `https://yourdomain.com/api/cron/scheduler?key=jhwefbepufrbfureifqphwregru8ehg`
   - Set it to run every 1-5 minutes (or as needed)

2. **Verify Installation**
   - Visit your admin dashboard at `/admin`
   - Ensure YouTube track scheduler is working properly
   - Check logs to confirm tracks are downloading

### Post-Deployment Steps

1. **Test All Functionality**
   - Test the track upload and download system
   - Check the checkout process
   - Verify YouTube Music integration

2. **Setup SSL and Security**
   - Vercel handles SSL certificates automatically
   - Ensure all internal links use HTTPS

3. **Monitor Performance**
   - Use Vercel Analytics to monitor site performance
   - Check server logs for any errors

4. **Regular Backups**
   - Set up automated backups for your track data
   - Consider a disaster recovery plan

## Need Help?

If you run into any issues with deployment, please refer to the [Vercel documentation](https://vercel.com/docs) or [GoDaddy support](https://www.godaddy.com/help).

For application-specific issues, check the admin dashboard for logs or contact the developer.

## Development

To run the project locally:

```bash
npm install
npm run dev
```

The application will be available at http://localhost:3000.

## Server Requirements

For YouTube Music integration, the server needs:
- Python 3.6 or higher
- ffmpeg
- yt-dlp

These requirements are automatically met on Vercel's serverless functions.

## Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

```env
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Database
DATABASE_URL=

# Email
EMAIL_SERVER_HOST=
EMAIL_SERVER_PORT=
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_FROM=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://qrmpgkotkbmoddqiorje.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFybXBna290a2Jtb2RkcWlvcmplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NTY0MDQsImV4cCI6MjA2MDMzMjQwNH0.HGnl-4zhndL9G5jlkZE_lC09H9szPtrzLC5d5rXGDCY

# Cron job security
CRON_SECRET_KEY=jhwefbepufrbfureifqphwregru8ehg
```

## Setting up Supabase

You'll need to set up a Supabase project and run the following SQL to create the necessary tables for user profiles.

1. Go to the SQL editor in the Supabase dashboard
2. Run the SQL from each of these files in order:
   - `sql/create_profiles_table.sql` - Creates the basic profiles table with security policies
   - `sql/create_profile_function.sql` - Creates a fallback function for profile creation
   - `sql/create_contact_messages_table.sql` - Creates the contact messages table and related functions

This setup provides three layers of redundancy for profile management:
1. Standard profiles table with RLS policies
2. SQL function for creating/updating profiles via RPC calls
3. Client-side fallbacks for various error conditions

The contact form also has multiple fallbacks:
1. It attempts to use the existing contact_messages table
2. If the table doesn't exist, it tries to create it using an RPC function
3. Proper error handling and user feedback for all scenarios

If you encounter any issues with profile updates or contact form submissions, run these SQL scripts again to ensure the database is properly configured.

## Scheduler Database Setup

The scheduler system requires a `scheduler_state` table in Supabase to function. If you're experiencing issues with the scheduler, follow these steps:

1. Run the SQL schema:
   - Go to the SQL editor in your Supabase dashboard
   - Execute the SQL code from `sql/create_scheduler_state_table.sql`

2. Test the connection:
   ```bash
   # Install dependencies if you haven't
   npm install

   # Run the test script
   node scripts/test-scheduler-db.js
   ```

3. Common issues:
   - Make sure the `json_state` column is of type `JSONB` (not text or JSON)
   - Check the RLS policies to ensure your app has proper permissions
   - Verify that the Supabase client is correctly connecting

If you're still having issues, check the server logs for detailed error messages.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deployment Notice
This project has been configured for deployment on Vercel. When deploying, ensure all pages have proper module exports to avoid TypeScript errors.

# YouTube Music Track Downloader

A simple Node.js CLI tool for downloading MP3 tracks, cover images, and metadata from YouTube Music playlists and channels.

## Features

- Downloads audio (MP3), cover image, and metadata from YouTube videos
- Organizes files in a structured folder hierarchy
- Prevents duplicate downloads
- Maintains a tracklist.json file for frontend use
- Works offline-first and locally

## Prerequisites

- Node.js
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) installed globally

## Installation

1. Clone this repository or download the source files
2. Install dependencies:
```bash
npm install
```
3. Make the script executable (optional):
```bash
chmod +x downloadTracks.js
```

## Usage

1. Edit `downloadTracks.js` to configure your source playlists or channels:
```javascript
const SOURCES = [
  'https://www.youtube.com/playlist?list=YOUR_PLAYLIST_ID',
  'https://www.youtube.com/channel/YOUR_CHANNEL_ID'
];
```

2. Run the script:
```bash
node downloadTracks.js
```

The script will:
- Process each source URL
- Download new tracks (skipping previously downloaded ones)
- Create organized folders and files
- Update tracklist.json with metadata for each track

## File Structure

```
├── downloadTracks.js       # Main script
├── downloaded.json         # List of downloaded video IDs
├── tracklist.json          # Metadata for all tracks (used by website)
└── tracks/                 # Directory for downloaded tracks
    └── track-name/         # Folder for each track (slugified title)
        ├── audio.mp3       # MP3 audio file
        ├── cover.jpg       # Cover image
        └── metadata.json   # Complete metadata
```

## Output

The script generates a `tracklist.json` file that looks like:

```json
[
  {
    "title": "Dreamy Lo-Fi Beat",
    "slug": "dreamy-lofi-beat",
    "artist": "Lo-Fi Artist",
    "duration": "2:45",
    "videoId": "abc123xyz",
    "audio": "/tracks/dreamy-lofi-beat/audio.mp3",
    "cover": "/tracks/dreamy-lofi-beat/cover.jpg",
    "url": "https://youtube.com/watch?v=abc123xyz"
  }
]
```

This file can be used by a frontend website to display the track library.

## Troubleshooting

If you encounter errors:

1. Make sure yt-dlp is installed and up-to-date:
```bash
# Install or update yt-dlp
pip install -U yt-dlp
```

2. Check folder permissions for write access
3. For YouTube rate limiting issues, try running the script later 

# ProdAI Beats Platform

A music marketplace platform for AI-generated beats with advanced track management features.

## API Routes Structure

The application uses Next.js App Router for organizing API routes. To avoid conflicts between routes in production, we follow these best practices:

### Route Organization

- `/api/tracks/*` - Main tracks API routes for accessing and managing tracks
- `/api/tracks/scheduler/*` - Scheduler-related API routes (sources, status, run, toggle)
- `/api/cron-jobs/*` - Cron job endpoints that should be called by external services

### Route Conflicts Fix

To prevent route conflicts in Next.js 13+ App Router, we've carefully structured nested routes to avoid having both a catch-all route and a more specific route at the same level. For example:

❌ **Problematic Structure (Avoid This)**
```
/api/tracks/scheduler/route.ts
/api/tracks/scheduler/status/route.ts
/api/tracks/scheduler/run/route.ts
```

✅ **Correct Structure**
```
/api/tracks/scheduler/status/route.ts
/api/tracks/scheduler/run/route.ts
/api/tracks/scheduler/sources/route.ts
/api/tracks/scheduler/toggle/route.ts
```

Note: We've moved the `/api/cron/scheduler` endpoint to `/api/cron-jobs/scheduler` to avoid potential conflicts with the tracks scheduler endpoints.

## Setup and Configuration

(Other sections of your README would go here) 