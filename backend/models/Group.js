import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Group title is required'],
      trim: true,
      maxlength: [60, 'Title cannot exceed 60 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    color: {
      type: String,
      trim: true,
      default: '#4f46e5', // Brand indigo accent
    },
  },
  { timestamps: true }
);

export default mongoose.model('Group', groupSchema);
