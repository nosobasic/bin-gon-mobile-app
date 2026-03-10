# 🧪 Stripe Test Mode Setup

## Quick Setup for Testing Payments

### 1. Get Your Test Keys from Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Make sure you're in **Test mode** (toggle in top left)
3. Copy your **Test Publishable Key** (starts with `pk_test_...`)
4. Copy your **Test Secret Key** (starts with `sk_test_...`)

### 2. Configure Your Keys

#### Backend (.env file):
```bash
STRIPE_SECRET_KEY=sk_test_your_test_secret_key_here
```

#### Frontend (src/config/stripe.ts):
```typescript
export const STRIPE_CONFIG = {
  publishableKey: 'pk_test_your_test_publishable_key_here', // Replace with your test key
  isTestMode: __DEV__,
};
```

### 3. Test Card Numbers

The app now includes a "Fill Test Card" button that automatically fills in:

- **Card Number**: `4242 4242 4242 4242` (Always succeeds)
- **Expiry**: `12/25`
- **CVC**: `123`
- **Country**: `United States`

### 4. Other Test Cards

- **Declined**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`
- **Expired**: `4000 0000 0000 0069`

### 5. Test Mode Features

- ✅ Test mode indicator shows in development
- ✅ One-click test card filling
- ✅ Safe test environment (no real money)
- ✅ All test transactions are logged in Stripe Dashboard

### 6. Going Live

When ready for production:
1. Get your **Live** keys from Stripe Dashboard
2. Update `src/config/stripe.ts` with live publishable key
3. Update backend with live secret key
4. Test mode indicator will automatically hide in production builds

## 🚀 Ready to Test!

Your payment system is now set up for safe testing. The test mode indicator will guide you through the process!
