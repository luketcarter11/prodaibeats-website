# Stripe Integration Guide

This document outlines how to configure and use the Stripe payment integration for ProdAI Beats.

## Setup Requirements

1. You need a Stripe account. If you don't have one, [sign up here](https://dashboard.stripe.com/register).

2. Set up the following environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_publishable_key_here
   STRIPE_SECRET_KEY=your_secret_key_here
   STRIPE_WEBHOOK_SECRET=your_webhook_secret_here
   ```

3. To find your API keys:
   - Log in to the [Stripe Dashboard](https://dashboard.stripe.com/)
   - Go to Developers > API keys
   - Copy the Publishable key and Secret key values

## Webhook Setup

For production use, you need to set up a webhook to handle events like successful payments:

1. In your Stripe Dashboard, go to Developers > Webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. After creating the webhook, copy the "Signing secret" and add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

## Testing the Integration

For local testing, you can use Stripe's test cards:

- Test successful payment: `4242 4242 4242 4242`
- Test authentication required: `4000 0025 0000 3155`
- Test payment declined: `4000 0000 0000 9995`

For any test card, use:
- Any future expiration date
- Any 3-digit CVC
- Any postal code

## Integration Structure

This implementation consists of:

1. **Frontend Components:**
   - `app/components/CheckoutForm.tsx` - Stripe Elements integration
   - `app/checkout/page.tsx` - Payment page with cart summary

2. **API Routes:**
   - `app/api/create-payment-intent/route.ts` - Creates a Stripe PaymentIntent
   - `app/api/webhook/route.ts` - Handles Stripe webhook events

3. **Utilities:**
   - `lib/stripe.ts` - Stripe initialization helpers

## Customization

You can customize the Stripe Elements appearance by modifying the `appearance` object in `app/checkout/page.tsx`.

## Fulfillment Process

After a successful payment, you should:

1. Save the order to your database
2. Generate license files if applicable
3. Send a confirmation email to the customer
4. Provide download access

Implement these steps in the webhook handler (`app/api/webhook/route.ts`) when processing successful payments.

## Production Considerations

1. Always use HTTPS in production
2. Implement proper error handling and logging
3. Consider implementing retry logic for failed webhook deliveries
4. Validate payment amounts server-side before creating PaymentIntents
5. Implement idempotency handling to prevent duplicate charges 