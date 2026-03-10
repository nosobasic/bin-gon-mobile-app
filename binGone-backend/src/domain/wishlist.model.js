import mongoose from 'mongoose';

const WishlistSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true
    },
    // Required fields from UI
    name: { type: String, required: true, trim: true },
    type: { type: String, trim: true },
    size: { type: String, trim: true },
    location: { type: String, trim: true },
    // Optional metadata
    notes: { type: String, default: '', trim: true },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high'], 
      default: 'medium' 
    },
    notifyOnAvailable: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

// Indexes for fast user queries
WishlistSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Wishlist', WishlistSchema);

