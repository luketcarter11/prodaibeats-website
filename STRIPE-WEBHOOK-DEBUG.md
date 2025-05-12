# Stripe Webhook Debugging Tools

This document describes the tools available for debugging Stripe webhooks and order creation in this application.

## Issue: Orders Not Being Created

If orders aren't appearing in your Supabase database after completing a Stripe checkout, the most likely cause is an issue with the Stripe webhook flow. The following tools can help you diagnose and fix the problem.

## Available Debug Tools

### 1. Test Order Creation

This tool allows you to directly create a test order in Supabase, bypassing Stripe completely:

- **URL**: `/api/test-order`
- **Purpose**: Verify that your Supabase connection and table structure are correct
- **How to use**: Visit the URL, fill in the form, and submit

If this works but real orders aren't being created, the issue is likely in the Stripe webhook flow.

### 2. Webhook Log Viewer

This tool shows you logs from webhook processing:

- **URL**: `/api/webhook-logs?format=html`
- **Purpose**: View detailed logs of webhook processing
- **How to use**: Visit the URL to see a log of webhook events and errors

### 3. Test Webhook Simulator

This tool simulates a Stripe webhook event:

- **URL**: `/api/test-webhook`
- **Purpose**: Simulate a Stripe `checkout.session.completed` event
- **How to use**: Fill in the form and submit to send a simulated webhook to your handler

### 4. Supabase User Lookup

This tool helps you find valid user IDs to use in your test webhooks:

- **URL**: `/api/test-webhook/users?format=html`
- **Purpose**: View and copy user IDs from your Supabase auth system
- **How to use**: Visit the URL to see a list of users and copy their IDs for testing

## Troubleshooting Steps

1. **Verify Supabase Connection**: Use the Test Order Creation tool to confirm you can create orders directly

2. **Inspect Webhook Logs**: Check the Webhook Log Viewer to see if webhooks are being received and processed

3. **Try with a Valid User ID**: Use the User Lookup tool to get a valid user ID, then use that ID in the Test Webhook Simulator

4. **Check Stripe Dashboard**: Verify that webhook events are being sent from Stripe in your Stripe dashboard under "Developers > Webhooks"

## Common Issues

### 1. Webhook Verification Failures

If you see "Webhook signature verification failed" errors, ensure:
- Your `STRIPE_WEBHOOK_SECRET` environment variable is correct
- The secret matches the one in your Stripe dashboard

### 2. "No such checkout.session" Error

If you see this error when testing with the webhook simulator:
- This is normal for test webhook events
- The webhook handler is trying to retrieve additional session data from Stripe
- We've updated the code to handle this gracefully
- Real Stripe events won't have this issue

### 3. Missing User ID

If orders are created but have null `user_id`:
- Ensure users are properly authenticated when checking out
- Check that user emails match between Stripe customer and Supabase user
- For testing, use the User Lookup tool to get a valid user ID

### 4. Invalid Track ID Format

If you see "invalid input syntax for type uuid" errors:
- Ensure track IDs in your system are valid UUIDs
- Check metadata passed to Stripe is correct
- The test tools automatically generate valid UUIDs if needed

## Testing Production Webhooks Locally

To test Stripe webhooks in development:

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Run: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/webhook`
4. Make test payments: `stripe trigger checkout.session.completed`

## Additional Resources

- [Stripe Webhook Documentation](https://stripe.com/docs/webhooks)
- [Troubleshooting Stripe Webhooks](https://stripe.com/docs/webhooks/troubleshooting)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth) 