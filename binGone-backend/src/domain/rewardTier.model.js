import mongoose from 'mongoose';

const RewardTierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // 'Free', 'Premium'
    displayName: { type: String, required: true }, // 'Community Member', 'Premium'
    pointThreshold: { type: Number, default: 0 }, // Points needed to reach this tier
    monthlyPrice: { type: Number, default: 0 }, // Monthly subscription price in cents
    pointUpgradeCost: { type: Number, default: null }, // Points needed for upgrade (if applicable)
    benefits: [{
      title: { type: String, required: true },
      description: { type: String, default: '' },
      type: { type: String, enum: ['feature', 'badge', 'boost', 'access'], default: 'feature' }
    }],
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }, // For ordering tiers
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

RewardTierSchema.index({ sortOrder: 1 });

export default mongoose.model('RewardTier', RewardTierSchema);
