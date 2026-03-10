import mongoose from 'mongoose';

const ThreadSchema = new mongoose.Schema(
  {
    listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastMessageAt: { type: Date, default: Date.now },
    donorUnreadCount: { type: Number, default: 0 },
    receiverUnreadCount: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
  },
  { versionKey: false, timestamps: true }
);

// Ensure one thread per listing-receiver pair
ThreadSchema.index({ listingId: 1, receiverId: 1 }, { unique: true });
ThreadSchema.index({ donorId: 1, lastMessageAt: -1 });
ThreadSchema.index({ receiverId: 1, lastMessageAt: -1 });

export default mongoose.model('Thread', ThreadSchema);
