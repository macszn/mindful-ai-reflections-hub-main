const mongoose = require('mongoose');

const activityStatsSchema = new mongoose.Schema(
  {
    journalEntries: { type: Number, default: 0 },
    conversations: { type: Number, default: 0 },
    activitiesCompleted: { type: Number, default: 0 },
    exerciseCompletions: { type: Number, default: 0 },
    articleCompletions: { type: Number, default: 0 },
    mediaCompletions: { type: Number, default: 0 },
  },
  { _id: false }
);

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
    /** "this" = in-progress current week; "last" = finalized previous-week wording */
    tense: { type: String, enum: ['this', 'last'], default: 'this' },
    /** When true, report is locked as the completed prior-week summary (Monday finalize) */
    finalized: { type: Boolean, default: false },
    summary: { type: String, required: true },
    emotionalSummary: { type: String, default: '' },
    dominantMoods: [{ type: String }],
    stressTriggers: [{ type: String }],
    positiveImprovements: [{ type: String }],
    recommendations: [{ type: String }],
    activityStats: { type: activityStatsSchema, default: () => ({}) },
    seenAt: { type: Date, default: null },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

weeklyReportSchema.index({ userId: 1, weekKey: 1 }, { unique: true });

module.exports = mongoose.model('WeeklyReport', weeklyReportSchema);
