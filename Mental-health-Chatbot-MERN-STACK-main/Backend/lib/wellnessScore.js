const moment = require('moment');
const MoodEntry = require('../models/MoodEntry');
const ActivityCompletion = require('../models/ActivityCompletion');
const WellnessScore = require('../models/WellnessScore');
const UserMemory = require('../models/UserMemory');

const MOOD_SCORE = {
  angry: 1,
  sad: 2,
  anxious: 3,
  tired: 3,
  calm: 4,
  grateful: 4,
  happy: 5,
  excited: 5,
};

const POSITIVE_WORDS = [
  'happy', 'grateful', 'hope', 'better', 'calm', 'peace', 'progress', 'proud',
  'thankful', 'relieved', 'ok', 'okay', 'good', 'great', 'love', 'support',
  'improving', 'stronger', 'rested', 'motivated',
];

const NEGATIVE_WORDS = [
  'sad', 'anxious', 'depressed', 'hopeless', 'overwhelmed', 'scared', 'worried',
  'lonely', 'worthless', 'exhausted', 'panic', 'anxiety', 'cry', 'crying',
  'hate', 'stuck', 'numb', 'worse', 'afraid',
];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function scoreToStars(score) {
  if (score >= 85) return 5;
  if (score >= 70) return 4;
  if (score >= 55) return 3;
  if (score >= 40) return 2;
  return 1;
}

function wellnessLabel(score) {
  if (score >= 85) return 'Thriving';
  if (score >= 70) return 'Strong';
  if (score >= 55) return 'Steady';
  if (score >= 40) return 'Building';
  return 'Needs care';
}

/** Push payload matching the Insights wellness score card. */
function formatScoreNotification(computed) {
  const label = wellnessLabel(computed.score);
  const stars = '⭐'.repeat(computed.stars || scoreToStars(computed.score));
  return {
    title: `Your Mindful Progress Score: ${computed.score}/100`,
    body: `${label} ${stars} — Try to maintain this level of wellness each day.`,
    url: '/insights',
    tag: 'Mindful-score',
  };
}

function average(nums) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function scoreJournals(entries) {
  if (!entries.length) return 35;
  const values = entries.map((e) => MOOD_SCORE[String(e.mood || '').toLowerCase()] || 3);
  const avg = average(values);
  const consistency = clamp((entries.length / 7) * 100, 0, 100);
  const moodPct = ((avg - 1) / 4) * 100;
  return Math.round(moodPct * 0.7 + consistency * 0.3);
}

function scoreConversationSentiment(chatMessages = [], memory = null) {
  const texts = (chatMessages || [])
    .filter((m) => m && (m.sender === 'user' || m.role === 'user'))
    .map((m) => String(m.content || '').toLowerCase())
    .slice(-40);

  if (!texts.length && memory?.emotionalSnapshots?.length) {
    const latest = memory.emotionalSnapshots[memory.emotionalSnapshots.length - 1];
    const avgMood = Number(latest.avgMoodScore) || 3;
    return Math.round(((avgMood - 1) / 4) * 100);
  }

  if (!texts.length) return 50;

  let pos = 0;
  let neg = 0;
  for (const t of texts) {
    for (const w of POSITIVE_WORDS) {
      if (t.includes(w)) pos += 1;
    }
    for (const w of NEGATIVE_WORDS) {
      if (t.includes(w)) neg += 1;
    }
  }

  const total = pos + neg;
  if (total === 0) return 55;
  const ratio = pos / total;
  return Math.round(clamp(ratio * 100 * 0.85 + 15, 0, 100));
}

function scoreActivity(completionsThisWeek, targetPerWeek = 3) {
  if (!completionsThisWeek) return 25;
  return Math.round(clamp((completionsThisWeek / targetPerWeek) * 100, 0, 100));
}

function scoreEmotionalTrends(weeklyEntries, previousWeekEntries, memory = null) {
  const weekVals = weeklyEntries.map((e) => MOOD_SCORE[String(e.mood || '').toLowerCase()] || 3);
  const prevVals = previousWeekEntries.map((e) => MOOD_SCORE[String(e.mood || '').toLowerCase()] || 3);
  const currentAvg = average(weekVals) || 3;
  const previousAvg = average(prevVals) || currentAvg;

  let deltaBoost = 50;
  if (previousAvg > 0) {
    const delta = currentAvg - previousAvg;
    deltaBoost = clamp(50 + delta * 20, 0, 100);
  }

  let memoryBoost = 50;
  if (memory?.emotionalSnapshots?.length >= 2) {
    const snaps = memory.emotionalSnapshots.slice(-2);
    const a = Number(snaps[0].avgMoodScore) || 3;
    const b = Number(snaps[1].avgMoodScore) || 3;
    memoryBoost = clamp(50 + (b - a) * 25, 0, 100);
  }

  const goalBoost =
    memory?.goals?.length
      ? clamp(
          (memory.goals.filter((g) => g.status === 'completed').length /
            Math.max(memory.goals.length, 1)) *
            100,
          0,
          100
        )
      : 50;

  return Math.round(deltaBoost * 0.5 + memoryBoost * 0.3 + goalBoost * 0.2);
}

async function computeWellnessScore(userId, options = {}) {
  const { chatMessages = [] } = options;
  const now = moment().endOf('day');
  const sevenDaysAgo = moment().subtract(6, 'days').startOf('day');
  const previousWeekStart = moment().subtract(13, 'days').startOf('day');
  const previousWeekEnd = moment().subtract(7, 'days').endOf('day');

  const [weeklyEntries, previousWeekEntries, weekActivities, memory] = await Promise.all([
    MoodEntry.find({
      userId,
      date: { $gte: sevenDaysAgo.toDate(), $lte: now.toDate() },
    }).lean(),
    MoodEntry.find({
      userId,
      date: { $gte: previousWeekStart.toDate(), $lte: previousWeekEnd.toDate() },
    }).lean(),
    ActivityCompletion.countDocuments({
      userId,
      completedAt: { $gte: sevenDaysAgo.toDate(), $lte: now.toDate() },
    }),
    UserMemory.findOne({ userId }).lean(),
  ]);

  const journals = scoreJournals(weeklyEntries);
  const sentiment = scoreConversationSentiment(chatMessages, memory);
  const activity = scoreActivity(weekActivities);
  const trends = scoreEmotionalTrends(weeklyEntries, previousWeekEntries, memory);

  const score = Math.round(
    journals * 0.35 + sentiment * 0.25 + activity * 0.2 + trends * 0.2
  );
  const stars = scoreToStars(score);

  return {
    score: clamp(score, 0, 100),
    stars,
    components: { journals, sentiment, activity, trends },
    meta: {
      journalEntriesThisWeek: weeklyEntries.length,
      activitiesThisWeek: weekActivities,
      computedAt: new Date().toISOString(),
    },
  };
}

async function upsertTodayScore(userId, computed) {
  const day = moment().startOf('day').toDate();
  return WellnessScore.findOneAndUpdate(
    { userId, date: day },
    {
      userId,
      date: day,
      score: computed.score,
      stars: computed.stars,
      components: computed.components,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function getScoreHistory(userId, days = 30) {
  const since = moment().subtract(days - 1, 'days').startOf('day').toDate();
  const rows = await WellnessScore.find({
    userId,
    date: { $gte: since },
  })
    .sort({ date: 1 })
    .lean();

  return rows.map((r) => ({
    date: moment(r.date).format('YYYY-MM-DD'),
    label: moment(r.date).format('MMM D'),
    score: r.score,
    stars: r.stars,
    components: r.components,
  }));
}

module.exports = {
  MOOD_SCORE,
  computeWellnessScore,
  upsertTodayScore,
  getScoreHistory,
  scoreToStars,
  wellnessLabel,
  formatScoreNotification,
};
