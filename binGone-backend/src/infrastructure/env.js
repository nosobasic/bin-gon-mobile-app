export function getEnv() {
  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  const mongodbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bingone';
  const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me';
  const corsOrigin = process.env.CORS_ORIGIN || '*';
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key';
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret';

  return { port, mongodbUri, jwtSecret, corsOrigin, STRIPE_SECRET_KEY: stripeSecretKey, STRIPE_WEBHOOK_SECRET: stripeWebhookSecret };
}



