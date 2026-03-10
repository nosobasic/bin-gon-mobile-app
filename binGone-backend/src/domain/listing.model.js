import mongoose from 'mongoose';

const ListingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    images: [{ type: String }],
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    address: { type: String },
    status: { type: String, enum: ['available', 'claimed', 'removed'], default: 'available' },
  },
  { versionKey: false, timestamps: true }
);

ListingSchema.index({ location: '2dsphere' });
ListingSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('Listing', ListingSchema);
