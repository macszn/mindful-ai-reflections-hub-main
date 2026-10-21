const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const UserMemory = require('../models/UserMemory');
const ChatExchange = require('../models/ChatExchange');
const WeeklyReport = require('../models/WeeklyReport');
const { buildMemoryContext, syncEmotionalHistoryFromJournals } = require('../lib/memoryService');
const { requireOwnUser } = require('../lib/auth');

router.use('/:userId', requireOwnUser);

async function clearPersonalizedHistory(userId) {
  await Promise.all([
    ChatExchange.deleteMany({ userId }),
    WeeklyReport.updateMany(
      { userId },
      {
        $set: {
          summary: 'Personalized reflections are off. Activity counts remain available.',
          emotionalSummary: '',
          dominantMoods: [],
          stressTriggers: [],
          positiveImprovements: [],
          recommendations: [],
        },
      }
    ),
  ]);
}

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const memory = await UserMemory.findOne({ userId }).lean();
    if (!memory?.consentEnabled) {
      await UserMemory.updateOne(
        { userId },
        {
          $setOnInsert: { userId, consentEnabled: false },
          $set: {
            triggers: [],
            goals: [],
            discussions: [],
            emotionalSnapshots: [],
            journalTrends: [],
          },
        },
        { upsert: true }
      );
      await clearPersonalizedHistory(userId);
      return res.json({ consentEnabled: false, discussions: [], triggers: [], goals: [], emotionalSnapshots: [], journalTrends: [] });
    }

    const { memory: currentMemory, journalData } = await buildMemoryContext(userId);
    return res.json({
      consentEnabled: true,
      triggers: currentMemory.triggers,
      goals: currentMemory.goals,
      discussions: currentMemory.discussions,
      emotionalSnapshots: currentMemory.emotionalSnapshots,
      journalTrends: journalData?.trends || currentMemory.journalTrends,
      updatedAt: currentMemory.updatedAt,
    });
  } catch (err) {
    console.error('Error fetching memory:', err);
    res.status(500).json({ error: 'Failed to load memory' });
  }
});

router.post('/:userId/consent', async (req, res) => {
  try {
    const { userId } = req.params;
    const { enabled } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled must be a boolean' });
    }

    const existing = await UserMemory.findOne({ userId }).select('consentEnabled').lean();
    const wasEnabled = Boolean(existing?.consentEnabled);
    const update = { $set: { consentEnabled: enabled } };
    if (!enabled || !wasEnabled) {
      Object.assign(update.$set, {
        triggers: [],
        goals: [],
        discussions: [],
        emotionalSnapshots: [],
        journalTrends: [],
      });
    }
    await UserMemory.updateOne(
      { userId },
      { $setOnInsert: { userId }, ...update },
      { upsert: true }
    );

    if (!enabled) await clearPersonalizedHistory(userId);
    if (enabled && !wasEnabled) await syncEmotionalHistoryFromJournals(userId);

    return res.json({ consentEnabled: enabled });
  } catch (err) {
    console.error('Error updating memory consent:', err);
    return res.status(500).json({ error: 'Failed to update memory settings' });
  }
});

router.post('/:userId/sync-journals', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const result = await syncEmotionalHistoryFromJournals(userId);
    res.json(result);
  } catch (err) {
    console.error('Error syncing journal memory:', err);
    res.status(500).json({ error: 'Failed to sync journal memory' });
  }
});

module.exports = router;
