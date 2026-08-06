const mongoose = require('mongoose');

const componentSchema = new mongoose.Schema(
  {
    journals: { type: Number, default: 0 },
    sentiment: { type: Number, default: 0 },
    activity: { type: Number, default: 0 },
    trends: { type: Number, default: 0 },
  },
  { _id: false }
);

const wellnessScoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
      index: true,
    },
    date: { type: Date, required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    stars: { type: Number, required: true, min: 1, max: 5 },
    components: { type: componentSchema, default: () => ({}) },
  },
  { timestamps: true }
);

wellnessScoreSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('WellnessScore', wellnessScoreSchema);
