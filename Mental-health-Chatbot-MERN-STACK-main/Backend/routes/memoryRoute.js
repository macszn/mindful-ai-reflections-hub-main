const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const UserMemory = require('../models/UserMemory');
const { buildMemoryContext, syncEmotionalHistoryFromJournals } = require('../lib/memoryService');

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const { memory, journalData } = await buildMemoryContext(userId);
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    res.json({
      triggers: memory.triggers,
      goals: memory.goals,
      discussions: memory.discussions,
      emotionalSnapshots: memory.emotionalSnapshots,
      journalTrends: journalData.trends || memory.journalTrends,
      updatedAt: memory.updatedAt,
    });
  } catch (err) {
    console.error('Error fetching memory:', err);
    res.status(500).json({ error: 'Failed to load memory' });
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
