import { NextResponse } from 'next/server';

// Cache prices for 1 minute
const CACHE_DURATION = 60 * 1000;
let priceCache: {
  timestamp: number;
  data: any | null;
} = {
  timestamp: 0,
  data: null
};

// Fallback prices (updated regularly)
const FALLBACK_PRICES = {
  SOL: 180.35, // Updated based on current market price
  PROD: 0.00005 // Default fallback price for PROD token
};

// Constants for API endpoints
const JUPITER_API_ENDPOINT = 'https://lite-api.jup.ag/price/v2';
const BIRDEYE_API_ENDPOINT = 'https://public-api.birdeye.so/defi/price';

// Token addresses
const SOL_TOKEN_ADDRESS = 'So11111111111111111111111111111111111111112';
const PROD_TOKEN_ADDRESS = 'FwqCgnf1H46XtPU2B1aDQRyKMhUpqaWkyuQ4yQ1ibouN';

export async function GET() {
  try {
    // Check cache first
    const now = Date.now();
    if (priceCache.data && (now - priceCache.timestamp) < CACHE_DURATION) {
      console.log('Returning cached price data:', priceCache.data);
      return NextResponse.json(priceCache.data);
    }

    // Initialize with fallback prices
    const prices = {
      solana: { usd: FALLBACK_PRICES.SOL },
      prod: { usd: FALLBACK_PRICES.PROD }
    };
    
    // Fetch prices from Jupiter API (primary source)
    try {
      const jupiterPrices = await fetchJupiterPrices();
      
      if (jupiterPrices) {
        // Update prices if available
        if (jupiterPrices.sol) {
          prices.solana.usd = jupiterPrices.sol;
        }
        
        if (jupiterPrices.prod) {
          prices.prod.usd = jupiterPrices.prod;
        }
        
        console.log('Successfully fetched prices from Jupiter API');
      } else {
        console.warn('Jupiter API failed, trying fallback sources...');
        
        // Try fallback sources
        const [solPriceSuccess, prodPriceSuccess] = await Promise.allSettled([
          fetchSolPrice(),
          fetchProdPrice()
        ]);
        
        // Update prices with fallback results if needed
        if (solPriceSuccess.status === 'fulfilled' && solPriceSuccess.value) {
          prices.solana.usd = solPriceSuccess.value;
        }
        
        if (prodPriceSuccess.status === 'fulfilled' && prodPriceSuccess.value) {
          prices.prod.usd = prodPriceSuccess.value;
        }
      }
    } catch (error) {
      console.error('Error fetching prices from primary source:', error);
      
      // Try fallback sources
      const [solPriceSuccess, prodPriceSuccess] = await Promise.allSettled([
        fetchSolPrice(),
        fetchProdPrice()
      ]);
      
      // Update prices with fallback results if needed
      if (solPriceSuccess.status === 'fulfilled' && solPriceSuccess.value) {
        prices.solana.usd = solPriceSuccess.value;
      }
      
      if (prodPriceSuccess.status === 'fulfilled' && prodPriceSuccess.value) {
        prices.prod.usd = prodPriceSuccess.value;
      }
    }
    
    // Update cache
    priceCache = {
      timestamp: now,
      data: prices
    };
    
    console.log('Returning price data:', prices);
    return NextResponse.json(prices);
  } catch (error) {
    console.error('Error in crypto price API:', error);
    
    // Return fallback prices on error
    const fallbackData = {
      solana: { usd: FALLBACK_PRICES.SOL },
      prod: { usd: FALLBACK_PRICES.PROD }
    };
    
    console.log('Returning fallback price data:', fallbackData);
    return NextResponse.json(fallbackData);
  }
}

// Function to fetch prices from Jupiter API (primary source)
async function fetchJupiterPrices() {
  console.log('Fetching prices from Jupiter API...');
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
  
  try {
    // Request both SOL and PROD token prices in one call
    const url = `${JUPITER_API_ENDPOINT}?ids=${SOL_TOKEN_ADDRESS},${PROD_TOKEN_ADDRESS}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`Jupiter API returned status: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.data) {
      console.error('Jupiter API returned unexpected data structure:', data);
      return null;
    }
    
    // Extract prices from response
    const prices = {
      sol: null as number | null,
      prod: null as number | null
    };
    
    // Get SOL price
    if (data.data[SOL_TOKEN_ADDRESS] && data.data[SOL_TOKEN_ADDRESS].price) {
      prices.sol = parseFloat(data.data[SOL_TOKEN_ADDRESS].price);
      console.log('Jupiter SOL price:', prices.sol);
    }
    
    // Get PROD price
    if (data.data[PROD_TOKEN_ADDRESS] && data.data[PROD_TOKEN_ADDRESS].price) {
      prices.prod = parseFloat(data.data[PROD_TOKEN_ADDRESS].price);
      console.log('Jupiter PROD price:', prices.prod);
    }
    
    return prices;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error fetching prices from Jupiter API:', error);
    return null;
  }
}

// Function to fetch SOL price from CoinGecko (fallback)
async function fetchSolPrice() {
  console.log('Fetching SOL price from CoinGecko (fallback)...');
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
  
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
      {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'User-Agent': 'Mozilla/5.0 (compatible; ProdAICryptoAPI/1.0)'
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`CoinGecko API returned status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    // Validate the expected data structure
    if (!data.solana || !data.solana.usd) {
      console.error('CoinGecko API returned unexpected data structure:', data);
      return null;
    }
    
    console.log('Successfully fetched SOL price from CoinGecko:', data.solana.usd);
    return data.solana.usd;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error fetching SOL price from CoinGecko:', error);
    return null;
  }
}

// Function to fetch PROD price from Birdeye API (fallback)
async function fetchProdPrice() {
  console.log('Fetching PROD price from Birdeye API (fallback)...');
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
  
  try {
    const url = `${BIRDEYE_API_ENDPOINT}`;
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'x-chain': 'solana'
    };
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`Birdeye API returned status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    // Validate the response
    if (data.success === false) {
      console.error('Birdeye API request failed:', data.message || 'Unknown error');
      return null;
    }
    
    if (!data.data || typeof data.data.value !== 'number') {
      console.error('Birdeye API returned unexpected data structure:', data);
      return null;
    }
    
    const price = data.data.value;
    console.log('Successfully fetched price from Birdeye:', price);
    return price;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error fetching from Birdeye:', error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
} 