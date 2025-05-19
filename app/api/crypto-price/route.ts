import { NextResponse } from 'next/server';

// Cache prices for 1 minute
const CACHE_DURATION = 60 * 1000;
let priceCache = {
  timestamp: 0,
  data: null
};

export async function GET() {
  try {
    // Check cache first
    const now = Date.now();
    if (priceCache.data && (now - priceCache.timestamp) < CACHE_DURATION) {
      return NextResponse.json(priceCache.data);
    }

    // Fetch fresh data from CoinGecko
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
      {
        headers: {
          'Accept': 'application/json',
          // Add your CoinGecko API key if you have one
          // 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY
        }
      }
    );

    if (!response.ok) {
      // If CoinGecko fails, return fallback prices
      return NextResponse.json({
        solana: { usd: 171.37 } // Fallback price
      });
    }

    const data = await response.json();
    
    // Update cache
    priceCache = {
      timestamp: now,
      data
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    
    // Return fallback prices on error
    return NextResponse.json({
      solana: { usd: 171.37 } // Fallback price
    });
  }
} 