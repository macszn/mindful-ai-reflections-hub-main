const mongoose = require('mongoose');

const weeklyReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
      index: true,
    },
    weekKey: { type: String, required: true },
    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },
    summary: { type: String, required: true },
    emotionalSummary: { type: String, default: '' },
    dominantMoods: [{ type: String }],
    stressTriggers: [{ type: String }],
    positiveImprovements: [{ type: String }],
    recommendations: [{ type: String }],
    seenAt: { type: Date, default: null },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

weeklyReportSchema.index({ userId: 1, weekKey: 1 }, { unique: true });

module.exports = mongoose.model('WeeklyReport', weeklyReportSchema);
