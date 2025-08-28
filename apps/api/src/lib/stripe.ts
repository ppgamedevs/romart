import Stripe from "stripe";

// Only initialize Stripe if the secret key is provided
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { 
      apiVersion: "2025-07-30.basil" 
    })
  : null;

// Helper function to check if Stripe is configured
export const isStripeConfigured = () => !!process.env.STRIPE_SECRET_KEY;
