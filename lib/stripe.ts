import Stripe from 'stripe';
import { loadStripe, Stripe as StripeClient } from '@stripe/stripe-js';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil',
  typescript: true,
});

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