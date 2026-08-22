const express = require('express');
const mongoose = require('mongoose');
const { getPublicKey, isPushConfigured, sendToUser } = require('../lib/pushService');
const { computeWellnessScore, upsertTodayScore, formatScoreNotification } = require('../lib/wellnessScore');
const { getQuoteOfTheDay, formatQuoteNotification } = require('../lib/quotes');
const { finalizePreviousWeekReport } = require('../lib/weeklyReport');
const { getJournalStreakStatus } = require('../lib/journalStreak');

const router = express.Router();

function getUsersModel() {
  return mongoose.model('Users');
}

router.get('/quote-of-the-day', (_req, res) => {
  return res.json(getQuoteOfTheDay());
});

router.get('/vapid-public-key', (_req, res) => {
  if (!isPushConfigured()) {
    return res.status(503).json({
      error: 'Push notifications are not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.',
      configured: false,
    });
  }
  return res.json({ publicKey: getPublicKey(), configured: true });
});

router.post('/subscribe', async (req, res) => {
  try {
    const { userId, subscription, preferences } = req.body || {};
    if (!userId || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ error: 'userId and a valid PushSubscription are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const Users = getUsersModel();
    const user = await Users.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found. Try logging out and back in.' });

    if (!Array.isArray(user.pushSubscriptions)) {
      user.pushSubscriptions = [];
    }

    const idx = user.pushSubscriptions.findIndex((s) => s.endpoint === subscription.endpoint);
    const entry = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      userAgent: req.headers['user-agent'] || '',
      createdAt: new Date(),
    };

    if (idx >= 0) {
      user.pushSubscriptions[idx] = entry;
    } else {
      user.pushSubscriptions.push(entry);
    }

    if (preferences && typeof preferences === 'object') {
      user.notificationPrefs = {
        quotes: preferences.quotes !== false,
        progressScore: preferences.progressScore !== false,
        weeklyReport: preferences.weeklyReport !== false,
        streakReminder: preferences.streakReminder !== false,
        enabled: preferences.enabled !== false,
      };
    } else {
      user.notificationPrefs = {
        ...(user.notificationPrefs?.toObject?.() || user.notificationPrefs || {}),
        enabled: true,
      };
    }

    await user.save();
    return res.json({ success: true, devices: user.pushSubscriptions.length });
  } catch (err) {
    console.error('[notifications] subscribe error:', err);
    return res.status(500).json({ error: 'Failed to save subscription' });
  }
});

router.post('/unsubscribe', async (req, res) => {
  try {
    const { userId, endpoint } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const Users = getUsersModel();
    const user = await Users.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (endpoint) {
      user.pushSubscriptions = (user.pushSubscriptions || []).filter((s) => s.endpoint !== endpoint);
    } else {
      user.pushSubscriptions = [];
      if (user.notificationPrefs) {
        user.notificationPrefs.enabled = false;
      }
    }

    await user.save();
    return res.json({ success: true });
  } catch (err) {
    console.error('[notifications] unsubscribe error:', err);
    return res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

router.get('/preferences/:userId', async (req, res) => {
  try {
    const Users = getUsersModel();
    const user = await Users.findById(req.params.userId).select('notificationPrefs pushSubscriptions');
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({
      preferences: user.notificationPrefs || {
        enabled: false,
        quotes: true,
        progressScore: true,
        weeklyReport: true,
        streakReminder: true,
      },
      deviceCount: (user.pushSubscriptions || []).length,
      pushConfigured: isPushConfigured(),
    });
  } catch (err) {
    console.error('[notifications] prefs error:', err);
    return res.status(500).json({ error: 'Failed to load preferences' });
  }
});

router.patch('/preferences/:userId', async (req, res) => {
  try {
    const Users = getUsersModel();
    const user = await Users.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const prefs = req.body || {};
    user.notificationPrefs = {
      enabled: prefs.enabled !== false,
      quotes: prefs.quotes !== false,
      progressScore: prefs.progressScore !== false,
      weeklyReport: prefs.weeklyReport !== false,
      streakReminder: prefs.streakReminder !== false,
    };
    await user.save();
    return res.json({ preferences: user.notificationPrefs });
  } catch (err) {
    console.error('[notifications] prefs update error:', err);
    return res.status(500).json({ error: 'Failed to update preferences' });
  }
});

router.post('/test', async (req, res) => {
  try {
    const { userId, type } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    if (!isPushConfigured()) {
      return res.status(503).json({ error: 'Push not configured on server' });
    }

    const Users = getUsersModel();
    const user = await Users.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let payload;
    if (type === 'score') {
      const computed = await computeWellnessScore(userId);
      await upsertTodayScore(userId, computed);
      payload = formatScoreNotification(computed);
    } else if (type === 'streak') {
      const { currentStreak } = await getJournalStreakStatus(userId);
      const streak = Math.max(currentStreak, 1);
      payload = {
        title: 'Keep your journal streak going',
        body: `You're on a ${streak}-day streak! Log today's mood to keep the momentum.`,
        url: '/journal',
        tag: 'Mindful-streak',
      };
    } else if (type === 'weekly-report') {
      const report = await finalizePreviousWeekReport(userId);
      if (!report) {
        return res.status(200).json({
          success: false,
          message: 'Not enough activity last week to generate a weekly report yet.',
        });
      }
      payload = {
        title: 'Your Weekly Mental Health Report',
        body: String(report.summary || '').slice(0, 180),
        url: '/insights',
        tag: 'mindcare-weekly-report',
        reportId: String(report._id),
      };
    } else {
      payload = formatQuoteNotification(getQuoteOfTheDay());
    }

    const result = await sendToUser(user, payload);
    return res.json({ success: true, ...result, payload });
  } catch (err) {
    console.error('[notifications] test error:', err);
    return res.status(500).json({ error: err.message || 'Failed to send test notification' });
  }
});

module.exports = router;
