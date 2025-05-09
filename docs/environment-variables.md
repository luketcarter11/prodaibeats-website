# Environment Variables Guide

This document outlines how to properly set up environment variables for the application, both locally and in production (Vercel).

## Required Environment Variables

The application requires the following environment variables:

| Variable Name | Purpose | Required In |
|--------------|---------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | The URL of your Supabase project | Browser & Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key for client-side operations | Browser & Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key for admin operations | Server only |
| `STRIPE_SECRET_KEY` | Stripe API secret key | Server only |
| `STRIPE_WEBHOOK_SECRET` | Secret for verifying Stripe webhooks | Server only |

## Vercel Setup

To properly set up environment variables on Vercel, follow these steps:

1. Go to your project on the Vercel dashboard
2. Navigate to Settings → Environment Variables
3. Add each required environment variable
4. Set the appropriate environment (Development, Preview, Production)

### Important: Preventing Build Errors

To prevent build errors related to the `SUPABASE_SERVICE_ROLE_KEY`, ensure that:

1. The environment variable is correctly set in Vercel's environment variables settings
2. The variable is marked as "Production" if you only want it available in the production environment
3. **Enable "Include in Build"** for the `SUPABASE_SERVICE_ROLE_KEY`

![Vercel Environment Variable Settings](https://example.com/vercel-env-vars.png)

## Local Development

For local development, create a `.env.local` file in the root of your project with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

## Troubleshooting

### "Error: supabaseKey is required"

This error occurs during build when the Supabase service role key is not available. To fix this:

1. Ensure `SUPABASE_SERVICE_ROLE_KEY` is properly set in Vercel's environment variables
2. Make sure "Include in Build" is enabled for this variable
3. Rebuild your application

### Checking Environment Variables

You can check if your environment variables are properly loaded in development mode by visiting `/api/debug-env?token=debug-prodai-2024`. This endpoint is only available in development mode and requires a token parameter for basic security.

## Security Considerations

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client side
- The service role key has full database access, so it should only be used in server-side code
- If you accidentally expose sensitive keys, rotate them immediately in the respective dashboards (Supabase, Stripe) 