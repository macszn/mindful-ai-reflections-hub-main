const mongoose = require('mongoose');

const activityCompletionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
      index: true,
    },
    activityId: { type: String, required: true },
    activityTitle: { type: String, default: '' },
    category: {
      type: String,
      enum: ['exercise', 'article', 'media', 'other'],
      default: 'exercise',
    },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

activityCompletionSchema.index({ userId: 1, activityId: 1, completedAt: -1 });

module.exports = mongoose.model('ActivityCompletion', activityCompletionSchema);
