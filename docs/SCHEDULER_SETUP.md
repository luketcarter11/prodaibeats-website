# Scheduler Setup Guide

This document explains how to set up and use the automatic scheduler for downloading tracks from YouTube.

## Environment Variables

First, make sure you have the following environment variable set in your `.env.local` file:

```
CRON_SECRET_KEY=jhwefbepufrbfureifqphwregru8ehg
```

This secret key protects your cron job endpoint from unauthorized access.

## Setting Up a Cron Job

You need to set up a cron job to automatically trigger the scheduler. You can use any cron job service, such as:

- [Cron-job.org](https://cron-job.org/)
- [EasyCron](https://www.easycron.com/)
- [SetCronJob](https://www.setcronjob.com/)

### Cron Job URL

When setting up the cron job, use the following URL format:

```
https://yourdomain.com/api/cron/scheduler?key=jhwefbepufrbfureifqphwregru8ehg
```

Replace `yourdomain.com` with your actual domain.

### Recommended Schedule

For optimal operation, set your cron job to run every 5-15 minutes. This ensures that the scheduler will check if it's time to download new tracks.

## Testing the Cron Job Endpoint

You can test if your cron job endpoint is working correctly by running the included test script:

```bash
./test-cron.sh
```

This script will:
1. Test the endpoint with the correct secret key
2. Test the endpoint with an incorrect key (should return 401 Unauthorized)

## How the Scheduler Works

1. The cron job calls the API endpoint every few minutes
2. The scheduler checks if it's time to run (based on the configured interval, default is 24 hours)
3. If it's time to run, the scheduler checks all active sources for new tracks
4. New tracks are downloaded, processed, and added to the database
5. The next run time is updated

## Managing the Scheduler via Admin UI

You can manage the scheduler through the admin interface:

1. Go to `/admin/tracks/scheduler`
2. Toggle the scheduler on/off
3. Add/remove sources (YouTube channels or playlists)
4. View logs and status

## Troubleshooting

If the scheduler is not running as expected:

1. Check your server logs for errors
2. Verify that the cron job is running by checking your cron job service logs
3. Ensure the `CRON_SECRET_KEY` matches in both the cron job URL and your environment variables
4. Check if the scheduler is enabled in the admin UI 