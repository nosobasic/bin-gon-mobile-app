import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    icon: { type: String, required: true },
  },
  { versionKey: false, timestamps: true }
);

export default mongoose.model('Category', CategorySchema);
