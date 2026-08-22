const cron = require('node-cron');
const mongoose = require('mongoose');
const { isPushConfigured, sendToUser } = require('./pushService');
const { computeWellnessScore, upsertTodayScore, formatScoreNotification } = require('./wellnessScore');
const { getQuoteOfTheDay, formatQuoteNotification } = require('./quotes');
const { finalizePreviousWeekReport } = require('./weeklyReport');
const { getJournalStreakStatus } = require('./journalStreak');
const MoodEntry = require('../models/MoodEntry');
const ChatExchange = require('../models/ChatExchange');
const ActivityCompletion = require('../models/ActivityCompletion');

function getUsersModel() {
  return mongoose.model('Users');
}

async function sendDailyQuotes() {
  if (!isPushConfigured()) return;

  const Users = getUsersModel();
  const users = await Users.find({
    'notificationPrefs.enabled': true,
    'notificationPrefs.quotes': { $ne: false },
    'pushSubscriptions.0': { $exists: true },
  });

  const payload = formatQuoteNotification(getQuoteOfTheDay());

  for (const user of users) {
    try {
      await sendToUser(user, payload);
    } catch (err) {
      console.error('[cron] quote push failed for', user._id, err.message);
    }
  }
  console.log(`[cron] Daily quote notifications sent to ${users.length} user(s)`);
}

async function sendWeeklyProgressScores() {
  if (!isPushConfigured()) return;

  const Users = getUsersModel();
  const users = await Users.find({
    'notificationPrefs.enabled': true,
    'notificationPrefs.progressScore': { $ne: false },
    'pushSubscriptions.0': { $exists: true },
  });

  let sent = 0;
  for (const user of users) {
    try {
      const computed = await computeWellnessScore(user._id);
      await upsertTodayScore(user._id, computed);
      await sendToUser(user, formatScoreNotification(computed));
      sent += 1;
    } catch (err) {
      console.error('[cron] score push failed for', user._id, err.message);
    }
  }
  console.log(`[cron] Current Insights score notifications sent to ${sent} user(s)`);
}

async function sendWeeklyMentalHealthReports() {
  const Users = getUsersModel();
  const users = await Users.find({ isVerified: { $ne: false } });
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  let generated = 0;
  let pushed = 0;

  for (const user of users) {
    try {
      const [hasJournal, hasChat, hasActivity] = await Promise.all([
        MoodEntry.exists({ userId: user._id, date: { $gte: since } }),
        ChatExchange.exists({ userId: user._id, recordedAt: { $gte: since } }),
        ActivityCompletion.exists({ userId: user._id, completedAt: { $gte: since } }),
      ]);

      if (!hasJournal && !hasChat && !hasActivity) continue;

      // Finalize PREVIOUS Monday–Sunday with "Last week, you did..." wording
      const report = await finalizePreviousWeekReport(user._id);
      if (!report) continue;

      generated += 1;

      const wantsPush =
        user.notificationPrefs?.enabled !== false &&
        user.notificationPrefs?.weeklyReport !== false &&
        user.pushSubscriptions?.length > 0;

      if (!isPushConfigured() || !wantsPush) continue;

      const summaryExcerpt = String(report.summary || '').slice(0, 180);
      await sendToUser(user, {
        title: 'Your Weekly Mental Health Report',
        body: summaryExcerpt + (String(report.summary || '').length > 180 ? '…' : ''),
        url: '/insights',
        tag: 'mindcare-weekly-report',
        reportId: String(report._id),
      });
      pushed += 1;
    } catch (err) {
      console.error('[cron] weekly report failed for', user._id, err.message);
    }
  }

  console.log(`[cron] Previous-week reports finalized: ${generated}, pushed: ${pushed}`);
}

async function sendStreakReminders() {
  if (!isPushConfigured()) return;

  const Users = getUsersModel();
  const users = await Users.find({
    'notificationPrefs.enabled': true,
    'notificationPrefs.streakReminder': { $ne: false },
    'pushSubscriptions.0': { $exists: true },
  });

  let sent = 0;

  for (const user of users) {
    try {
      const { currentStreak, journaledToday } = await getJournalStreakStatus(user._id);

      if (currentStreak < 1 || journaledToday) continue;

      const dayWord = currentStreak === 1 ? 'day' : 'days';
      await sendToUser(user, {
        title: 'Keep your journal streak going',
        body: `You're on a ${currentStreak}-${dayWord} streak! Log today's mood to keep the momentum.`,
        url: '/journal',
        tag: 'Mindful-streak',
      });
      sent += 1;
    } catch (err) {
      console.error('[cron] streak reminder failed for', user._id, err.message);
    }
  }

  console.log(`[cron] Streak reminders sent to ${sent} user(s)`);
}

function startNotificationScheduler() {
  cron.schedule('0 9 * * *', () => {
    sendDailyQuotes().catch((err) => console.error('[cron] daily quotes:', err));
  });

  // Evening streak reminder — 6:00 PM daily
  cron.schedule('0 18 * * *', () => {
    sendStreakReminders().catch((err) => console.error('[cron] streak reminders:', err));
  });

  // Monday 8:00 — AI weekly mental health report (before wellness score push)
  cron.schedule('0 8 * * 1', () => {
    sendWeeklyMentalHealthReports().catch((err) => console.error('[cron] weekly reports:', err));
  });

  // Daily 10:00 — current Insights wellness score
  cron.schedule('0 10 * * *', () => {
    sendWeeklyProgressScores().catch((err) => console.error('[cron] wellness scores:', err));
  });

  if (isPushConfigured()) {
    console.log('[cron] Scheduler started (quotes 9:00, scores 10:00, streak 18:00, weekly report Mon 8:00)');
  } else {
    console.log('[cron] Scheduler started (weekly reports Mon 8:00; push idle until VAPID keys set)');
  }
}

module.exports = {
  startNotificationScheduler,
  sendDailyQuotes,
  sendWeeklyProgressScores,
  sendWeeklyMentalHealthReports,
  sendStreakReminders,
};
