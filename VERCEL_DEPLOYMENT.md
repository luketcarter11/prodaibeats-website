# Vercel Deployment Guide

## Environment Variables (REQUIRED)

The application is failing to build because Supabase environment variables are missing. You must set the following required environment variables in your Vercel project:

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

### Required Variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Additional Variables (if using these features):
- `STRIPE_SECRET_KEY` - For payment processing
- `STRIPE_WEBHOOK_SECRET` - For Stripe webhooks
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - For Stripe client-side integration
- `NEXTAUTH_URL` - Your full production URL (e.g., https://your-app.vercel.app)
- `NEXTAUTH_SECRET` - A random string for NextAuth security
- `RESEND_API_KEY` - If using Resend for email
- `CRON_SECRET_KEY` - For securing cron job endpoints

## Step-by-Step Deployment Guide

1. **Prepare Your Repository**
   - Ensure all code changes are committed to your repository
   - Make sure you've updated the Supabase client as shown in the latest changes

2. **Set Environment Variables in Vercel**
   - Go to Vercel Dashboard → Select your project → Settings → Environment Variables
   - Add all the required environment variables listed above
   - Make sure to apply to Production, Preview, and Development environments

3. **Redeploy the Application**
   - Go to the Deployments tab in your Vercel project
   - Select "Redeploy" on your latest deployment (or push a new commit to trigger a deployment)

4. **Verify Deployment**
   - Check the deployment logs to make sure the build succeeds
   - Verify that the application is working as expected

## Troubleshooting

If you continue to have issues with the deployment:

1. Check the build logs to see if there are any specific errors
2. Verify that your environment variables are correctly set in the Vercel dashboard
3. Make sure your Supabase project is active and the credentials are correct
4. If you're getting TypeScript errors, check that the updated `next.config.js` is being applied

## Local Development

When developing locally:

1. Copy the `.env.example` file to `.env.local`
2. Fill in the environment variables with your development credentials
3. Run `npm run dev` to start the development server 