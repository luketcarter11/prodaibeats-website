# Crypto Payment Setup

This document explains how to set up the environment variables required for the crypto payment functionality to work properly.

## API Keys Setup

The crypto payment system uses multiple APIs to fetch cryptocurrency prices and check for transactions:

### 1. Helius API (Required for Solana Transaction Verification)

The system uses [Helius API](https://helius.xyz/) to check for Solana transactions. Follow these steps:

1. Sign up for a Helius account at https://helius.xyz/
2. Create a new API key in your Helius dashboard
3. Add it to your environment variables (see below)

### 2. Birdeye API (Recommended for PROD Token Pricing)

The system uses [Birdeye API](https://birdeye.so/) to fetch accurate $PROD token prices. Follow these steps:

1. Sign up for a Birdeye account at https://birdeye.so/
2. Get an API key from your Birdeye dashboard
3. Add it to your environment variables (see below)

## Environment Variables

Create or edit the `.env.local` file in the root of your project with the following variables:

```
# Solana API Keys
NEXT_PUBLIC_HELIUS_API_KEY="your_helius_api_key_here"
BIRDEYE_API_KEY="your_birdeye_api_key_here"

# Payment Simulation (development only)
# Set to 'true' to enable simulated payments, 'false' to disable
NEXT_PUBLIC_ENABLE_PAYMENT_SIMULATION="false"
```

1. Replace `your_helius_api_key_here` with your actual Helius API key
2. Replace `your_birdeye_api_key_here` with your actual Birdeye API key
3. Restart your development server

## Development Testing

If you need to test the payment flow in development without real blockchain transactions, you can enable the simulation mode:

1. Set `NEXT_PUBLIC_ENABLE_PAYMENT_SIMULATION="true"` in your `.env.local` file
2. This will allow the system to randomly simulate successful payments for testing purposes
3. **Important:** Always set this to `"false"` in production

## Production Environment

For production, make sure:

1. You have valid API keys set in your environment variables
2. The simulation mode is disabled (`NEXT_PUBLIC_ENABLE_PAYMENT_SIMULATION="false"` or not set)
3. The correct Solana wallet addresses are configured in the constants at the top of `app/crypto-payment/page.tsx`

## Troubleshooting

### Helius API Issues

If you see a `401 Unauthorized` error in the console when checking for payments, it means:
1. Your Helius API key is missing or invalid
2. You need to check your `.env.local` file and ensure the API key is set correctly
3. The API key might have expired or reached its rate limit

### Birdeye API Issues

If you see errors related to fetching the PROD token price:
1. Verify your Birdeye API key is correctly set
2. Check if you have hit any rate limits
3. The system will fall back to hardcoded prices if the API fails

### Price Fetching Issues

If prices aren't updating correctly:
1. Check the browser console for specific error messages
2. Ensure your API keys have the correct permissions
3. The system will use fallback prices if API calls fail

For additional help, refer to:
- [Helius API documentation](https://docs.helius.xyz/)
- [Birdeye API documentation](https://docs.birdeye.so/) 