const moment = require('moment');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const MoodEntry = require('../models/MoodEntry');
const ActivityCompletion = require('../models/ActivityCompletion');
const ChatExchange = require('../models/ChatExchange');
const WeeklyReport = require('../models/WeeklyReport');
const UserMemory = require('../models/UserMemory');
const { computeWellnessScore } = require('./wellnessScore');

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

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

/** Monday 00:00:00 → Sunday 23:59:59.999 (ISO week) */
function getWeekBounds(reference = moment()) {
  const weekStart = reference.clone().startOf('isoWeek');
  const weekEnd = reference.clone().endOf('isoWeek');
  const weekKey = weekStart.format('GGGG-[W]WW');
  return { weekStart, weekEnd, weekKey };
}

function getPreviousWeekBounds(reference = moment()) {
  return getWeekBounds(reference.clone().subtract(1, 'week'));
}

/**
 * Monday modal window: Monday at/after 08:00 local server time through end of Monday.
 */
function isMondayModalWindow(now = moment()) {
  return now.isoWeekday() === 1 && now.hour() >= 8;
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

function moodDeltaPct(weekEntries, compareEntries, moodName) {
  const a = weekEntries.filter((e) => String(e.mood).toLowerCase() === moodName).length;
  const b = compareEntries.filter((e) => String(e.mood).toLowerCase() === moodName).length;
  if (b === 0) return null;
  return Math.round(((b - a) / b) * 100);
}

function extractStressTriggers(journalEntries, chatMessages, memory) {
  const triggers = [];
  if (memory?.triggers?.length) {
    triggers.push(
      ...memory.triggers
        .sort((a, b) => (b.mentionCount || 0) - (a.mentionCount || 0))
        .slice(0, 3)
        .map((t) => t.label)
    );
  }

  const text = [
    ...journalEntries.map((e) => `${e.content || ''} ${(e.tags || []).join(' ')}`),
    ...chatMessages.map((m) => m.userMessage || m.content || ''),
  ]
    .join(' ')
    .toLowerCase();

  if (/exam|coursework|study|school|academic|assignment/.test(text)) triggers.push('Academic workload');
  if (/work|job|deadline|boss|office/.test(text)) triggers.push('Work pressure');
  if (/sleep|insomnia|tired|exhausted/.test(text)) triggers.push('Sleep difficulties');
  if (/relationship|partner|boyfriend|girlfriend|spouse|breakup/.test(text)) {
    triggers.push('Relationship stress');
  }
  if (/family|parent|mother|father|sibling/.test(text)) triggers.push('Family stress');
  if (/anxious|anxiety|panic|worried/.test(text)) triggers.push('Anxiety');

  return [...new Set(triggers)].slice(0, 4);
}

function buildActivityStats({ journals, chats, activities }) {
  const byCategory = { exercise: 0, article: 0, media: 0, other: 0 };
  for (const a of activities) {
    const cat = a.category || 'other';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }
  return {
    journalEntries: journals.length,
    conversations: chats.length,
    activitiesCompleted: activities.length,
    exerciseCompletions: byCategory.exercise || 0,
    articleCompletions: byCategory.article || 0,
    mediaCompletions: byCategory.media || 0,
  };
}

function activitySentence(stats, tense) {
  const prefix = tense === 'last' ? 'Last week, you did' : 'This week, you did';
  const parts = [];
  if (stats.journalEntries > 0) {
    parts.push(
      `${stats.journalEntries} mood journal ${stats.journalEntries === 1 ? 'entry' : 'entries'}`
    );
  }
  if (stats.conversations > 0) {
    parts.push(
      `${stats.conversations} ${stats.conversations === 1 ? 'conversation' : 'conversations'} with Mindful`
    );
  }
  if (stats.exerciseCompletions > 0) {
    parts.push(
      `${stats.exerciseCompletions} wellness ${stats.exerciseCompletions === 1 ? 'exercise' : 'exercises'}`
    );
  } else if (stats.activitiesCompleted > 0) {
    parts.push(
      `${stats.activitiesCompleted} wellness ${stats.activitiesCompleted === 1 ? 'activity' : 'activities'}`
    );
  }

  if (!parts.length) {
    return tense === 'last'
      ? 'Last week, there was limited tracked activity in Mindful.'
      : 'This week, you are just getting started in Mindful.';
  }

  if (parts.length === 1) return `${prefix} ${parts[0]}.`;
  if (parts.length === 2) return `${prefix} ${parts[0]} and ${parts[1]}.`;
  return `${prefix} ${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}.`;
}

function buildFallbackReport({ journals, priorJournals, chats, activities, memory, wellness, tense }) {
  const stats = buildActivityStats({ journals, chats, activities });
  const moods = dominantMoods(journals);
  const triggers = extractStressTriggers(journals, chats, memory);
  const anxiousDelta = moodDeltaPct(journals, priorJournals, 'anxious');
  const avgThis = avgMood(journals);
  const avgPrior = avgMood(priorJournals);
  const weekWord = tense === 'last' ? 'Last week' : 'This week';

  const positiveImprovements = [];
  if (anxiousDelta != null && anxiousDelta > 0) {
    positiveImprovements.push(
      `Anxiety-related journal entries decreased by ${anxiousDelta}% compared to the prior week.`
    );
  }
  if (avgPrior > 0 && avgThis > avgPrior + 0.3) {
    positiveImprovements.push('Average journal mood improved compared to the prior week.');
  }
  if (stats.exerciseCompletions >= 2) {
    positiveImprovements.push(
      `You completed ${stats.exerciseCompletions} wellness exercises — solid consistency.`
    );
  }
  if (wellness?.score >= 70) {
    positiveImprovements.push(`Your wellness score is ${wellness.score}/100.`);
  }
  if (!positiveImprovements.length && (stats.journalEntries || stats.conversations)) {
    positiveImprovements.push('You showed up for yourself by checking in with Mindful.');
  }

  const recommendations = [];
  if (triggers.some((t) => /academic|exam|work/i.test(t))) {
    recommendations.push('Try a 5-minute breathing break between study or work blocks.');
  }
  if (moods.includes('anxious') || moods.includes('tired')) {
    recommendations.push('Consider keeping an evening wind-down or mindfulness routine.');
  }
  if (!recommendations.length) {
    recommendations.push('Continue journaling and chatting when you need practical support.');
  }

  const lead = activitySentence(stats, tense);
  const extra = [];
  if (moods.length) extra.push(`Dominant moods: ${moods.join(', ')}`);
  if (triggers[0]) extra.push(`${triggers[0]} showed up as a notable stress factor`);
  if (recommendations[0]) extra.push(recommendations[0].replace(/\.$/, ''));

  const summary = [lead.replace(/\.$/, ''), ...extra].filter(Boolean).join('. ') + '.';

  return {
    summary,
    emotionalSummary: journals.length
      ? `${weekWord} you logged ${journals.length} journal ${journals.length === 1 ? 'entry' : 'entries'} with dominant moods: ${moods.join(', ') || 'mixed'}.`
      : `${weekWord} journal activity was limited — chatting and resources still count toward your report.`,
    dominantMoods: moods,
    stressTriggers: triggers,
    positiveImprovements,
    recommendations: recommendations.slice(0, 3),
    activityStats: stats,
    tense,
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

async function gatherWeekActivity(userId, weekStart, weekEnd) {
  const priorStart = weekStart.clone().subtract(1, 'week');
  const priorEnd = weekEnd.clone().subtract(1, 'week');

  const [journals, priorJournals, chats, activities, memory] = await Promise.all([
    MoodEntry.find({
      userId,
      date: { $gte: weekStart.toDate(), $lte: weekEnd.toDate() },
    }).lean(),
    MoodEntry.find({
      userId,
      date: { $gte: priorStart.toDate(), $lte: priorEnd.toDate() },
    }).lean(),
    ChatExchange.find({
      userId,
      recordedAt: { $gte: weekStart.toDate(), $lte: weekEnd.toDate() },
    })
      .sort({ recordedAt: -1 })
      .limit(80)
      .lean(),
    ActivityCompletion.find({
      userId,
      completedAt: { $gte: weekStart.toDate(), $lte: weekEnd.toDate() },
    }).lean(),
    UserMemory.findOne({ userId }).lean(),
  ]);

  const wellness = memory?.consentEnabled
    ? await computeWellnessScore(userId)
    : null;
  const reportChats = memory?.consentEnabled
    ? chats
    : chats.map(({ userMessage: _userMessage, assistantMessage: _assistantMessage, ...chat }) => chat);

  return { journals, priorJournals, chats: reportChats, activities, memory, wellness };
}

async function generateReportContent(userId, weekStart, weekEnd, tense = 'this') {
  const data = await gatherWeekActivity(userId, weekStart, weekEnd);
  const stats = buildActivityStats({
    journals: data.journals,
    chats: data.chats,
    activities: data.activities,
  });

  const hasAny =
    stats.journalEntries > 0 || stats.conversations > 0 || stats.activitiesCompleted > 0;

  if (!hasAny) {
    return null;
  }

  if (!data.memory?.consentEnabled) {
    return {
      summary: activitySentence(stats, tense),
      emotionalSummary: 'Personalized emotional reflections are off. This report uses activity counts only.',
      dominantMoods: [],
      stressTriggers: [],
      positiveImprovements: [],
      recommendations: [],
      activityStats: stats,
      tense,
    };
  }

  const payload = { ...data, tense, stats };
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return buildFallbackReport(payload);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const weekPhrase = tense === 'last' ? 'Last week' : 'This week';
    const activityLead = activitySentence(stats, tense);

    const prompt = `You are Mindful, a compassionate mental health companion. Write a weekly mental health report based ONLY on the structured ACTIVITY DATA below.

CRITICAL RULES:
- Use the exact counts from ACTIVITY DATA. Do NOT invent journals, chats, exercises, moods, or events.
- Start the "summary" with wording like "${weekPhrase}, you did..." reflecting the real counts (you may refine the provided lead sentence slightly for fluency, but keep all numbers accurate).
- Do not claim activities that are zero.
- Stay warm, concise, and actionable.

Return ONLY valid JSON (no markdown):
{
  "summary": "2-4 sentences starting with ${weekPhrase.toLowerCase()} activity counts, then emotional patterns and one practical tip",
  "emotionalSummary": "1-2 sentences on emotional tone based only on journal moods / chat snippets",
  "dominantMoods": ["mood1"],
  "stressTriggers": ["trigger1"],
  "positiveImprovements": ["fact-based improvement"],
  "recommendations": ["practical recommendation"]
}

Period: ${weekStart.format('MMM D')} – ${weekEnd.format('MMM D, YYYY')} (Monday–Sunday)
Tense: ${tense} (${weekPhrase})

ACTIVITY DATA (authoritative counts):
${JSON.stringify(stats)}

Suggested opening sentence (numbers are correct — keep them):
${activityLead}

Journal entries this period (${data.journals.length}): ${JSON.stringify(
      data.journals.slice(0, 25).map((e) => ({
        date: moment(e.date).format('YYYY-MM-DD'),
        mood: e.mood,
        tags: e.tags,
        content: String(e.content || '').slice(0, 280),
      }))
    )}

Chat conversations this period (${data.chats.length}): ${JSON.stringify(
      data.chats.slice(0, 25).map((c) => ({
        date: moment(c.recordedAt).format('YYYY-MM-DD'),
        userMessage: String(c.userMessage || '').slice(0, 250),
      }))
    )}

Resources / exercises completed (${data.activities.length}): ${JSON.stringify(
      data.activities.slice(0, 20).map((a) => ({
        title: a.activityTitle || a.activityId,
        category: a.category,
        date: moment(a.completedAt).format('YYYY-MM-DD'),
      }))
    )}

Prior-week journal count for comparison only: ${data.priorJournals.length}
Wellness score (optional context): ${data.wellness ? `${data.wellness.score}/100` : 'n/a'}
Known memory triggers (optional): ${(data.memory?.triggers || [])
      .slice(0, 5)
      .map((t) => t.label)
      .join(', ') || 'none'}`;

    const result = await model.generateContent(prompt);
    const parsed = parseReportJson(result.response.text());
    if (!parsed.summary) throw new Error('Empty AI summary');

    // Ensure summary leads with real counts if the model drifted
    if (!/\d+/.test(parsed.summary) && (stats.journalEntries || stats.conversations || stats.activitiesCompleted)) {
      parsed.summary = `${activityLead} ${parsed.summary}`;
    }

    return {
      ...parsed,
      activityStats: stats,
      tense,
    };
  } catch (err) {
    console.error('[weeklyReport] AI generation failed, using fallback:', err.message);
    return buildFallbackReport(payload);
  }
}

/**
 * Regenerate (or create) the report for a given week. Current-week reports stay unfinalized
 * and are overwritten on each Insights visit. Finalized prior-week reports are left alone unless force.
 */
async function upsertWeeklyReport(userId, { weekStart, weekEnd, weekKey, tense, finalize = false, force = false }) {
  const existing = await WeeklyReport.findOne({ userId, weekKey });
  if (existing?.finalized && !force) {
    return existing;
  }

  const content = await generateReportContent(userId, weekStart, weekEnd, tense);
  if (!content) {
    if (existing && !existing.finalized) {
      // Clear thin weeks? Keep prior draft if any activity was removed — regenerate empty as null
      return null;
    }
    return null;
  }

  const doc = {
    userId,
    weekKey,
    weekStart: weekStart.toDate(),
    weekEnd: weekEnd.toDate(),
    tense: content.tense || tense,
    finalized: Boolean(finalize),
    summary: content.summary,
    emotionalSummary: content.emotionalSummary || '',
    dominantMoods: content.dominantMoods || [],
    stressTriggers: content.stressTriggers || [],
    positiveImprovements: content.positiveImprovements || [],
    recommendations: content.recommendations || [],
    activityStats: content.activityStats || {},
    generatedAt: new Date(),
  };

  // Preserve seenAt for finalized Monday reports that were already viewed
  if (existing?.seenAt && finalize) {
    doc.seenAt = existing.seenAt;
  } else if (!finalize) {
    // Current-week live report: don't drive the Monday modal
    doc.seenAt = existing?.seenAt || null;
  }

  return WeeklyReport.findOneAndUpdate(
    { userId, weekKey },
    { $set: doc },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

/** Insights: always refresh the in-progress current week ("This week, you did...") */
async function refreshCurrentWeekReport(userId) {
  const { weekStart, weekEnd, weekKey } = getWeekBounds();
  return upsertWeeklyReport(userId, {
    weekStart,
    weekEnd,
    weekKey,
    tense: 'this',
    finalize: false,
    force: true,
  });
}

/** Monday cron / modal: finalize previous Monday–Sunday with "Last week, you did..." */
async function finalizePreviousWeekReport(userId) {
  const { weekStart, weekEnd, weekKey } = getPreviousWeekBounds();
  return upsertWeeklyReport(userId, {
    weekStart,
    weekEnd,
    weekKey,
    tense: 'last',
    finalize: true,
    force: false,
  });
}

/**
 * For Monday popup: return previous week's finalized report only in the Monday ≥8:00 window,
 * and only if not yet seen.
 */
async function getMondayModalReport(userId, now = moment()) {
  if (!isMondayModalWindow(now)) {
    return { report: null, show: false, reason: 'outside_monday_window' };
  }

  const { weekKey } = getPreviousWeekBounds(now);
  let report = await WeeklyReport.findOne({ userId, weekKey });

  if (!report || !report.finalized) {
    report = await finalizePreviousWeekReport(userId);
  }

  if (!report) {
    return { report: null, show: false, reason: 'no_activity' };
  }

  if (report.seenAt) {
    return { report: report.toObject?.() || report, show: false, reason: 'already_seen' };
  }

  return { report: report.toObject?.() || report, show: true, reason: 'ready' };
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

/** @deprecated Prefer refreshCurrentWeekReport / finalizePreviousWeekReport */
async function generateWeeklyReportForUser(userId, referenceDate = moment()) {
  const bounds = getWeekBounds(referenceDate);
  const isCurrent = bounds.weekKey === getWeekBounds().weekKey;
  return upsertWeeklyReport(userId, {
    ...bounds,
    tense: isCurrent ? 'this' : 'last',
    finalize: !isCurrent,
    force: isCurrent,
  });
}

module.exports = {
  getWeekBounds,
  getPreviousWeekBounds,
  isMondayModalWindow,
  refreshCurrentWeekReport,
  finalizePreviousWeekReport,
  getMondayModalReport,
  generateWeeklyReportForUser,
  generateReportContent,
  getLatestReport,
  markReportSeen,
  getReportHistory,
  activitySentence,
};
