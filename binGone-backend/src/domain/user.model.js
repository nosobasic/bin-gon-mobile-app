import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    accountType: { type: String, enum: ['donor', 'receiver'], default: 'donor' },
    phoneNumber: { type: String, default: '' },
    address: { type: String, default: '' },
    profileImageUrl: { type: String, default: '' },
    resetOtp: { type: String, default: null },
    resetOtpExpiresAt: { type: Date, default: null },
    resetOtpVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    emailVerificationOtp: { type: String, default: null },
    emailVerificationOtpExpiresAt: { type: Date, default: null },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
    // Reward System Fields
    points: { type: Number, default: 0 },
    tier: { type: String, enum: ['Free', 'Premium'], default: 'Free' },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    badges: [{ type: String }], // e.g., 'Basic Donor Badge', 'Super Donor Badge'
    subscriptionStartDate: { type: Date, default: null },
    subscriptionEndDate: { type: Date, default: null },
    isPremium: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

UserSchema.index({ location: '2dsphere' });

// Generate referral code helper function
export function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Auto-generate referral code for new users
UserSchema.pre('save', function(next) {
  if (this.isNew && !this.referralCode) {
    this.referralCode = generateReferralCode();
  }
  next();
});

export default mongoose.model('User', UserSchema);


