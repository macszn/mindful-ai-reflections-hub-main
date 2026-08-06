const cron = require('node-cron');
const mongoose = require('mongoose');
const { isPushConfigured, sendToUser } = require('./pushService');
const { computeWellnessScore, upsertTodayScore } = require('./wellnessScore');
const { pickRandomQuote } = require('./quotes');
const { generateWeeklyReportForUser } = require('./weeklyReport');
const MoodEntry = require('../models/MoodEntry');

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

  const quote = pickRandomQuote();
  const payload = {
    title: 'MindCare Daily Motivation',
    body: `"${quote.text}" — ${quote.author}`,
    url: '/',
    tag: 'mindcare-quote',
  };

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

  for (const user of users) {
    try {
      const computed = await computeWellnessScore(user._id);
      await upsertTodayScore(user._id, computed);
      await sendToUser(user, {
        title: 'Your Weekly Wellness Progress',
        body: `Score: ${computed.score}/100 ${'⭐'.repeat(computed.stars)} — open Insights to see your trend.`,
        url: '/insights',
        tag: 'mindcare-score',
      });
    } catch (err) {
      console.error('[cron] score push failed for', user._id, err.message);
    }
  }
  console.log(`[cron] Weekly progress notifications sent to ${users.length} user(s)`);
}

async function sendWeeklyMentalHealthReports() {
  const Users = getUsersModel();
  const users = await Users.find({ isVerified: { $ne: false } });

  let generated = 0;
  let pushed = 0;

  for (const user of users) {
    try {
      const hasRecentActivity = await MoodEntry.exists({
        userId: user._id,
        date: { $gte: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000) },
      });

      if (!hasRecentActivity) continue;

      const report = await generateWeeklyReportForUser(user._id);
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
        body: summaryExcerpt + (report.summary.length > 180 ? '…' : ''),
        url: '/insights',
        tag: 'mindcare-weekly-report',
        reportId: String(report._id),
      });
      pushed += 1;
    } catch (err) {
      console.error('[cron] weekly report failed for', user._id, err.message);
    }
  }

  console.log(`[cron] Weekly mental health reports: ${generated} generated, ${pushed} pushed`);
}

function startNotificationScheduler() {
  cron.schedule('0 9 * * *', () => {
    sendDailyQuotes().catch((err) => console.error('[cron] daily quotes:', err));
  });

  // Monday 8:00 — AI weekly mental health report (before wellness score push)
  cron.schedule('0 8 * * 1', () => {
    sendWeeklyMentalHealthReports().catch((err) => console.error('[cron] weekly reports:', err));
  });

  cron.schedule('0 10 * * 1', () => {
    sendWeeklyProgressScores().catch((err) => console.error('[cron] weekly scores:', err));
  });

  if (isPushConfigured()) {
    console.log('[cron] Scheduler started (quotes 9:00 daily, weekly report Mon 8:00, scores Mon 10:00)');
  } else {
    console.log('[cron] Scheduler started (weekly reports Mon 8:00; push idle until VAPID keys set)');
  }
}

module.exports = {
  startNotificationScheduler,
  sendDailyQuotes,
  sendWeeklyProgressScores,
  sendWeeklyMentalHealthReports,
};
