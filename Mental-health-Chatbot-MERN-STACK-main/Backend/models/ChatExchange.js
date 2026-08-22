const mongoose = require('mongoose');

const chatExchangeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
      index: true,
    },
    userMessage: { type: String, required: true },
    assistantMessage: { type: String, default: '' },
    recordedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

chatExchangeSchema.index({ userId: 1, recordedAt: -1 });

module.exports = mongoose.model('ChatExchange', chatExchangeSchema);
