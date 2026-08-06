const moment = require('moment');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const MoodEntry = require('../models/MoodEntry');
const ActivityCompletion = require('../models/ActivityCompletion');
const WeeklyReport = require('../models/WeeklyReport');
const UserMemory = require('../models/UserMemory');
const { buildMemoryContext } = require('./memoryService');
const { computeWellnessScore } = require('./wellnessScore');

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

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

function getWeekBounds(reference = moment()) {
  const weekStart = reference.clone().startOf('isoWeek');
  const weekEnd = reference.clone().endOf('isoWeek');
  const weekKey = weekStart.format('GGGG-[W]WW');
  return { weekStart, weekEnd, weekKey };
}

function getPreviousWeekBounds(reference = moment()) {
  const prev = reference.clone().subtract(1, 'week');
  return getWeekBounds(prev);
}

function dominantMoods(entries) {
  const counts = {};
  for (const e of entries) {
    const mood = String(e.mood || '').toLowerCase();
    if (!mood) continue;
    counts[mood] = (counts[mood] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([mood]) => mood);
}

function avgMood(entries) {
  if (!entries.length) return 0;
  const total = entries.reduce((s, e) => s + (MOOD_SCORE[String(e.mood).toLowerCase()] || 3), 0);
  return total / entries.length;
}

function moodDeltaPct(thisWeek, lastWeek) {
  const thisAnxious = thisWeek.filter((e) => String(e.mood).toLowerCase() === 'anxious').length;
  const lastAnxious = lastWeek.filter((e) => String(e.mood).toLowerCase() === 'anxious').length;
  if (lastAnxious === 0) return null;
  return Math.round(((lastAnxious - thisAnxious) / lastAnxious) * 100);
}

function topStressTriggers(memory, thisWeekEntries) {
  const triggers = [];
  if (memory?.triggers?.length) {
    triggers.push(
      ...memory.triggers
        .sort((a, b) => (b.mentionCount || 0) - (a.mentionCount || 0))
        .slice(0, 3)
        .map((t) => t.label)
    );
  }
  const text = thisWeekEntries.map((e) => `${e.content} ${(e.tags || []).join(' ')}`).join(' ').toLowerCase();
  if (/exam|coursework|study|school|academic|assignment/.test(text)) {
    triggers.push('Academic workload');
  }
  if (/work|job|deadline|boss/.test(text)) {
    triggers.push('Work pressure');
  }
  if (/sleep|insomnia|tired/.test(text)) {
    triggers.push('Sleep difficulties');
  }
  return [...new Set(triggers)].slice(0, 4);
}

function buildFallbackReport({ thisWeek, lastWeek, memory, wellness, activitiesCount }) {
  const moods = dominantMoods(thisWeek);
  const triggers = topStressTriggers(memory, thisWeek);
  const anxiousDelta = moodDeltaPct(thisWeek, lastWeek);
  const avgThis = avgMood(thisWeek);
  const avgLast = avgMood(lastWeek);

  const positiveImprovements = [];
  if (anxiousDelta != null && anxiousDelta > 0) {
    positiveImprovements.push(`Anxiety-related entries decreased by ${anxiousDelta}% compared to last week.`);
  }
  if (avgLast > 0 && avgThis > avgLast + 0.3) {
    positiveImprovements.push('Your average journal mood improved compared to last week.');
  }
  if (activitiesCount >= 2) {
    positiveImprovements.push(`You completed ${activitiesCount} wellness activities this week — great consistency.`);
  }
  if (wellness?.score >= 70) {
    positiveImprovements.push(`Your wellness score is ${wellness.score}/100 — keep up the momentum.`);
  }
  if (!positiveImprovements.length && thisWeek.length) {
    positiveImprovements.push('You showed up for yourself by journaling this week.');
  }

  const recommendations = [];
  if (triggers.some((t) => /academic|exam|work/i.test(t))) {
    recommendations.push('Try a 5-minute breathing break between study or work blocks.');
  }
  if (moods.includes('anxious') || moods.includes('tired')) {
    recommendations.push('Consider maintaining an evening mindfulness or wind-down routine.');
  }
  if (memory?.goals?.length) {
    const activeGoal = memory.goals.find((g) => g.status === 'active');
    if (activeGoal) recommendations.push(`Keep working toward your goal: "${activeGoal.text.slice(0, 80)}".`);
  }
  if (!recommendations.length) {
    recommendations.push('Continue journaling and check in with MindCare when you need support.');
  }

  const primaryTrigger = triggers[0] || 'everyday stressors';
  const improvementLine =
    positiveImprovements[0] ||
    (thisWeek.length ? 'Your emotional patterns are becoming clearer with regular journaling.' : '');

  const summaryParts = [];
  if (improvementLine) summaryParts.push(improvementLine.replace(/\.$/, ''));
  if (triggers.length) {
    summaryParts.push(`${primaryTrigger} remains a primary stress factor this week`);
  }
  if (recommendations[0]) {
    summaryParts.push(recommendations[0].replace(/\.$/, ''));
  }

  const summary =
    summaryParts.length >= 2
      ? `${summaryParts[0]}. ${summaryParts[1]}. ${summaryParts[2] || recommendations[0]}.`
      : summaryParts.join('. ') + (summaryParts.length ? '.' : 'Your weekly mental health report is ready.');

  return {
    summary,
    emotionalSummary: thisWeek.length
      ? `This week you logged ${thisWeek.length} journal entries with dominant moods: ${moods.join(', ') || 'mixed'}.`
      : 'Limited journal data this week — more entries will sharpen your weekly insights.',
    dominantMoods: moods,
    stressTriggers: triggers,
    positiveImprovements,
    recommendations: recommendations.slice(0, 3),
  };
}

function parseReportJson(text) {
  const raw = String(text || '').trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  return {
    summary: String(parsed.summary || '').trim(),
    emotionalSummary: String(parsed.emotionalSummary || '').trim(),
    dominantMoods: Array.isArray(parsed.dominantMoods) ? parsed.dominantMoods.map(String).slice(0, 5) : [],
    stressTriggers: Array.isArray(parsed.stressTriggers) ? parsed.stressTriggers.map(String).slice(0, 5) : [],
    positiveImprovements: Array.isArray(parsed.positiveImprovements)
      ? parsed.positiveImprovements.map(String).slice(0, 5)
      : [],
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations.map(String).slice(0, 4)
      : [],
  };
}

async function gatherWeekData(userId, weekStart, weekEnd) {
  const prevStart = weekStart.clone().subtract(1, 'week');
  const prevEnd = weekEnd.clone().subtract(1, 'week');

  const [thisWeek, lastWeek, memory, memoryContext, activitiesCount, wellness] = await Promise.all([
    MoodEntry.find({
      userId,
      date: { $gte: weekStart.toDate(), $lte: weekEnd.toDate() },
    }).lean(),
    MoodEntry.find({
      userId,
      date: { $gte: prevStart.toDate(), $lte: prevEnd.toDate() },
    }).lean(),
    UserMemory.findOne({ userId }).lean(),
    buildMemoryContext(userId).catch(() => ({ text: '' })),
    ActivityCompletion.countDocuments({
      userId,
      completedAt: { $gte: weekStart.toDate(), $lte: weekEnd.toDate() },
    }),
    computeWellnessScore(userId).catch(() => null),
  ]);

  return {
    thisWeek,
    lastWeek,
    memory,
    memoryContext: memoryContext?.text || '',
    activitiesCount,
    wellness,
  };
}

async function generateReportContent(userId, weekStart, weekEnd) {
  const data = await gatherWeekData(userId, weekStart, weekEnd);

  if (!data.thisWeek.length && !data.lastWeek.length && !data.memoryContext.trim()) {
    return null;
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return buildFallbackReport(data);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `You are MindCare, a compassionate mental health companion. Write a weekly mental health report for the user based ONLY on the data below.

Return ONLY valid JSON (no markdown) in this shape:
{
  "summary": "2-3 sentences in plain language like: This week, anxiety-related entries decreased by 15%. Academic workload remains your primary stress factor. Consider maintaining your evening mindfulness routine.",
  "emotionalSummary": "1-2 sentences describing overall emotional tone this week",
  "dominantMoods": ["mood1", "mood2"],
  "stressTriggers": ["trigger1", "trigger2"],
  "positiveImprovements": ["improvement1", "improvement2"],
  "recommendations": ["recommendation1", "recommendation2"]
}

Week: ${weekStart.format('MMM D')} – ${weekEnd.format('MMM D, YYYY')}
This week journal entries (${data.thisWeek.length}): ${JSON.stringify(
      data.thisWeek.slice(0, 20).map((e) => ({
        date: moment(e.date).format('YYYY-MM-DD'),
        mood: e.mood,
        tags: e.tags,
        content: String(e.content || '').slice(0, 300),
      }))
    )}
Last week journal entries (${data.lastWeek.length}): ${JSON.stringify(
      data.lastWeek.slice(0, 15).map((e) => ({ mood: e.mood, content: String(e.content || '').slice(0, 200) }))
    )}
Activities completed this week: ${data.activitiesCount}
Wellness score: ${data.wellness ? `${data.wellness.score}/100` : 'n/a'}
User memory context:
${data.memoryContext.slice(0, 2500) || 'None'}

Be specific, warm, and actionable. Use percentages when comparing weeks if data supports it.`;

    const result = await model.generateContent(prompt);
    const parsed = parseReportJson(result.response.text());
    if (!parsed.summary) throw new Error('Empty AI summary');
    return parsed;
  } catch (err) {
    console.error('[weeklyReport] AI generation failed, using fallback:', err.message);
    return buildFallbackReport(data);
  }
}

async function generateWeeklyReportForUser(userId, referenceDate = moment()) {
  const { weekStart, weekEnd, weekKey } = getWeekBounds(referenceDate);

  const existing = await WeeklyReport.findOne({ userId, weekKey });
  if (existing) return existing;

  const content = await generateReportContent(userId, weekStart, weekEnd);
  if (!content) return null;

  return WeeklyReport.create({
    userId,
    weekKey,
    weekStart: weekStart.toDate(),
    weekEnd: weekEnd.toDate(),
    ...content,
    seenAt: null,
  });
}

async function getLatestReport(userId) {
  return WeeklyReport.findOne({ userId }).sort({ weekStart: -1 }).lean();
}

async function markReportSeen(userId, reportId) {
  return WeeklyReport.findOneAndUpdate(
    { _id: reportId, userId },
    { seenAt: new Date() },
    { new: true }
  );
}

async function getReportHistory(userId, limit = 12) {
  return WeeklyReport.find({ userId }).sort({ weekStart: -1 }).limit(limit).lean();
}

module.exports = {
  getWeekBounds,
  getPreviousWeekBounds,
  generateWeeklyReportForUser,
  generateReportContent,
  getLatestReport,
  markReportSeen,
  getReportHistory,
};
