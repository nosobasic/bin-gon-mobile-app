// Stripe Configuration
// Replace with your actual test publishable key from Stripe Dashboard

export const STRIPE_CONFIG = {
  // Test Mode Keys (for development)
  publishableKey: 'pk_test_51SGPjo2QPKv3f80shPAlJzuOmstOB2rsYXxENjIrgcrDmU8AK04DHMMglKpOLHjZUW3n5wfxNZ0RoewjpG0m8swV00Ji0pzAIK', // Your test key
  
  // Live Mode Keys (for production) - uncomment when ready for production
  // publishableKey: 'pk_live_51SGPjo2QPKv3f80szKhxJuvlOViXn32diLOfgflw8xMSRuTfHgY7aHkmZ57g3JH9UnO6eFGd0pqsY8mUcrzo08Nf00L9ClvZsV',
  
  // Environment detection
  isTestMode: __DEV__, // true in development, false in production
};

// Test card numbers for development
export const TEST_CARDS = {
  success: '4242 4242 4242 4242',
  declined: '4000 0000 0000 0002',
  insufficientFunds: '4000 0000 0000 9995',
  expired: '4000 0000 0000 0069',
  cvc: '123',
  expiry: '12/25',
  country: 'United States'
};

// Helper function to get the correct publishable key
export const getStripePublishableKey = () => {
  return STRIPE_CONFIG.publishableKey;
};

// Helper function to check if we're in test mode
export const isTestMode = () => {
  return STRIPE_CONFIG.isTestMode;
};
