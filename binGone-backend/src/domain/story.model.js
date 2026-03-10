import mongoose from 'mongoose';

const StorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    images: [{ type: String }],
    published: { type: Boolean, default: false },
  },
  { versionKey: false, timestamps: true }
);

export default mongoose.model('Story', StorySchema);


