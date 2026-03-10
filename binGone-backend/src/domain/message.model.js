import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 2000 },
    messageType: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
    attachmentUrl: { type: String }, // for images/files
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
    readAt: { type: Date },
  },
  { versionKey: false, timestamps: true }
);

MessageSchema.index({ threadId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });

export default mongoose.model('Message', MessageSchema);
