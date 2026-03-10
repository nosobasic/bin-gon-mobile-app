import mongoose from 'mongoose';

const ReferralSchema = new mongoose.Schema(
  {
    referrerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    refereeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    referralCode: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'completed', 'rewarded', 'expired'], 
      default: 'pending' 
    },
    // Reward details
    pointsAwarded: { type: Number, default: 0 },
    rewardType: { 
      type: String, 
      enum: ['signup', 'first_donation', 'premium_upgrade'], 
      default: 'signup' 
    },
    // Tracking
    signupDate: { type: Date, default: null },
    firstDonationDate: { type: Date, default: null },
    premiumUpgradeDate: { type: Date, default: null },
    // Metadata
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

ReferralSchema.index({ referrerId: 1, status: 1 });
ReferralSchema.index({ refereeId: 1 });
ReferralSchema.index({ referralCode: 1 });

// Update the updatedAt field before saving
ReferralSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Referral', ReferralSchema);
