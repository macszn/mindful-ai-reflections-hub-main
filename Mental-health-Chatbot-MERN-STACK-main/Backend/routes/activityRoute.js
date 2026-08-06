const express = require('express');
const ActivityCompletion = require('../models/ActivityCompletion');

const router = express.Router();

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    const days = Math.min(Number(req.query.days) || 30, 90);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const completions = await ActivityCompletion.find({
      userId,
      completedAt: { $gte: since },
    })
      .sort({ completedAt: -1 })
      .lean();

    const completedIds = [...new Set(completions.map((c) => c.activityId))];

    return res.json({
      completions,
      completedIds,
      count: completions.length,
      uniqueCount: completedIds.length,
    });
  } catch (err) {
    console.error('[activities] list error:', err);
    return res.status(500).json({ error: 'Failed to load activities' });
  }
});

router.post('/complete', async (req, res) => {
  try {
    const { userId, activityId, activityTitle, category } = req.body || {};
    if (!userId || !activityId) {
      return res.status(400).json({ error: 'userId and activityId are required' });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const existing = await ActivityCompletion.findOne({
      userId,
      activityId,
      completedAt: { $gte: startOfDay },
    });

    if (existing) {
      return res.json({ completion: existing, alreadyCompleted: true });
    }

    const completion = await ActivityCompletion.create({
      userId,
      activityId: String(activityId),
      activityTitle: activityTitle || '',
      category: category || 'exercise',
    });

    return res.status(201).json({ completion, alreadyCompleted: false });
  } catch (err) {
    console.error('[activities] complete error:', err);
    return res.status(500).json({ error: 'Failed to mark activity complete' });
  }
});

module.exports = router;
