const mongoose = require('mongoose');

const triggerSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    context: { type: String, default: '' },
    firstMentioned: { type: Date, default: Date.now },
    lastMentioned: { type: Date, default: Date.now },
    mentionCount: { type: Number, default: 1 },
  },
  { _id: false }
);

const goalSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused'],
      default: 'active',
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const discussionSchema = new mongoose.Schema(
  {
    summary: { type: String, required: true },
    topics: [{ type: String }],
    userSnippet: { type: String, default: '' },
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const emotionalSnapshotSchema = new mongoose.Schema(
  {
    periodLabel: { type: String, required: true },
    periodStart: { type: Date },
    periodEnd: { type: Date },
    dominantMoods: [{ type: String }],
    themes: [{ type: String }],
    themeCounts: { type: mongoose.Schema.Types.Mixed, default: {} },
    entryCount: { type: Number, default: 0 },
    avgMoodScore: { type: Number, default: 0 },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const userMemorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
      unique: true,
    },
    triggers: { type: [triggerSchema], default: [] },
    goals: { type: [goalSchema], default: [] },
    discussions: { type: [discussionSchema], default: [] },
    emotionalSnapshots: { type: [emotionalSnapshotSchema], default: [] },
    journalTrends: { type: [String], default: [] },
  },
  { timestamps: true }
);

userMemorySchema.index({ userId: 1 });

const UserMemory = mongoose.model('UserMemory', userMemorySchema);

module.exports = UserMemory;
