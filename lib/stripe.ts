// NOTE: Stripe implementation temporarily commented out for cryptocurrency payment implementation
/*
import Stripe from 'stripe';
import { loadStripe, Stripe as StripeClient } from '@stripe/stripe-js';

// Only initialize Stripe with secret key on the server side
export const stripe = typeof window === 'undefined' && process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-04-30.basil',
      typescript: true,
    })
  : null;

let stripePromise: Promise<StripeClient | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        // Server-side
        resolve(null);
        return;
      }

      if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        reject(new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined'));
        return;
      }

      resolve(loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY));
    });
  }
  return stripePromise;
}; 
*/

// Temporary placeholder for crypto payment implementation
export const getStripe = () => null;
export const stripe = null; 