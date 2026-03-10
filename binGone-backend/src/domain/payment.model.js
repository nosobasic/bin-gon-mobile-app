import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true }, // Amount in cents
    currency: { type: String, default: 'usd' },
    status: { 
      type: String, 
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'], 
      default: 'pending' 
    },
    paymentMethod: { 
      type: String, 
      enum: ['card', 'bank_account', 'points'], 
      required: true 
    },
    // Stripe specific fields
    stripePaymentIntentId: { type: String, default: null },
    stripeCustomerId: { type: String, default: null },
    stripeChargeId: { type: String, default: null },
    paymentMethodId: { type: String, default: null }, // Stripe payment method ID from React Native SDK
    // Card details (encrypted or tokenized)
    cardLast4: { type: String, default: null },
    cardBrand: { type: String, default: null },
    cardExpMonth: { type: Number, default: null },
    cardExpYear: { type: Number, default: null },
    // Upgrade details
    upgradeType: { 
      type: String, 
      enum: ['premium_subscription', 'points_purchase', 'listing_boost'], 
      required: true 
    },
    targetTier: { type: String, default: null }, // For tier upgrades
    pointsUsed: { type: Number, default: 0 }, // Points deducted for upgrade
    // Metadata
    description: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Timestamps
    paidAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ stripePaymentIntentId: 1 });
PaymentSchema.index({ status: 1 });

export default mongoose.model('Payment', PaymentSchema);
