const moment = require('moment');
const mongoose = require('mongoose');
const UserMemory = require('../models/UserMemory');
const MoodEntry = require('../models/MoodEntry');

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

const THEME_KEYWORDS = {
  exams: ['exam', 'exams', 'test', 'tests', 'studying', 'study', 'midterm', 'finals', 'coursework'],
  work: ['work', 'job', 'boss', 'deadline', 'office', 'colleague', 'career'],
  sleep: ['sleep', 'insomnia', 'tired', 'exhausted', 'rest', 'night'],
  relationships: ['relationship', 'partner', 'boyfriend', 'girlfriend', 'dating', 'breakup', 'marriage'],
  family: ['family', 'parent', 'mother', 'father', 'sibling', 'home'],
  loneliness: ['lonely', 'alone', 'isolated', 'nobody', 'no one cares'],
  anxiety: ['anxious', 'anxiety', 'panic', 'worried', 'worry', 'nervous'],
  self_esteem: ['worthless', 'failure', 'not good enough', 'insecure', 'confidence'],
};

const MAX_DISCUSSIONS = 25;
const MAX_TRIGGERS = 20;
const MAX_GOALS = 15;

function isValidUserId(userId) {
  return userId && mongoose.Types.ObjectId.isValid(userId);
}

async function getOrCreateMemory(userId) {
  if (!isValidUserId(userId)) return null;
  let memory = await UserMemory.findOne({ userId });
  if (!memory) {
    memory = await UserMemory.create({ userId });
  }
  return memory;
}

function countThemesInEntries(entries) {
  const counts = {};
  const combined = entries
    .map((e) => `${e.content || ''} ${(e.tags || []).join(' ')}`.toLowerCase())
    .join(' ');

  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    let count = 0;
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = combined.match(regex);
      if (matches) count += matches.length;
    }
    if (count > 0) counts[theme] = count;
  }
  return counts;
}

function dominantMoodsFromEntries(entries) {
  const moodCounts = {};
  for (const entry of entries) {
    const mood = String(entry.mood || '').toLowerCase();
    moodCounts[mood] = (moodCounts[mood] || 0) + 1;
  }
  return Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([mood]) => mood);
}

function avgMoodScore(entries) {
  if (!entries.length) return 0;
  const total = entries.reduce((sum, e) => sum + (MOOD_SCORE[String(e.mood).toLowerCase()] || 3), 0);
  return Number((total / entries.length).toFixed(2));
}

function themeLabel(theme) {
  const labels = {
    exams: 'exam-related stress',
    work: 'work stress',
    sleep: 'sleep difficulties',
    relationships: 'relationship concerns',
    family: 'family stress',
    loneliness: 'loneliness',
    anxiety: 'anxiety',
    self_esteem: 'self-esteem challenges',
  };
  return labels[theme] || theme.replace(/_/g, ' ');
}

function buildJournalTrends(recentEntries, previousEntries) {
  const recentThemes = countThemesInEntries(recentEntries);
  const previousThemes = countThemesInEntries(previousEntries);
  const trends = [];
  const allThemeKeys = new Set([...Object.keys(recentThemes), ...Object.keys(previousThemes)]);

  for (const theme of allThemeKeys) {
    const recent = recentThemes[theme] || 0;
    const previous = previousThemes[theme] || 0;
    const label = themeLabel(theme);

    if (previous > 0 && recent === 0) {
      trends.push(`${label} has not appeared in your recent journal entries, compared to ${previous} mention(s) last month.`);
    } else if (previous === 0 && recent > 0) {
      trends.push(`${label} has come up ${recent} time(s) in your recent journals — a new theme to watch.`);
    } else if (previous > 0 && recent < previous) {
      trends.push(
        `Your recent journal entries suggest ${label} has decreased compared to last month (${recent} vs ${previous} mentions).`
      );
    } else if (recent > previous && previous > 0) {
      trends.push(
        `Your recent journal entries suggest ${label} has increased compared to last month (${recent} vs ${previous} mentions).`
      );
    } else if (recent > 0 && recent === previous) {
      trends.push(`${label} remains steady in your journals this month (${recent} mentions).`);
    }
  }

  const recentAvg = avgMoodScore(recentEntries);
  const previousAvg = avgMoodScore(previousEntries);
  if (recentEntries.length > 0 && previousEntries.length > 0) {
    const diff = recentAvg - previousAvg;
    if (diff >= 0.4) {
      trends.push(`Your average mood in journals has improved compared to last month.`);
    } else if (diff <= -0.4) {
      trends.push(`Your average mood in journals has dipped compared to last month.`);
    }
  }

  return trends.slice(0, 8);
}

async function syncEmotionalHistoryFromJournals(userId) {
  if (!isValidUserId(userId)) return { trends: [], snapshots: [] };
  const memory = await UserMemory.findOne({ userId }).select('consentEnabled').lean();
  if (!memory?.consentEnabled) return { trends: [], snapshots: [] };

  const now = moment();
  const recentStart = moment().subtract(29, 'days').startOf('day');
  const previousStart = moment().subtract(59, 'days').startOf('day');
  const previousEnd = moment().subtract(30, 'days').endOf('day');

  const [recentEntries, previousEntries] = await Promise.all([
    MoodEntry.find({ userId, date: { $gte: recentStart.toDate(), $lte: now.toDate() } }).lean(),
    MoodEntry.find({
      userId,
      date: { $gte: previousStart.toDate(), $lte: previousEnd.toDate() },
    }).lean(),
  ]);

  const trends = buildJournalTrends(recentEntries, previousEntries);

  const recentSnapshot = {
    periodLabel: 'Last 30 days',
    periodStart: recentStart.toDate(),
    periodEnd: now.toDate(),
    dominantMoods: dominantMoodsFromEntries(recentEntries),
    themes: Object.keys(countThemesInEntries(recentEntries)),
    themeCounts: countThemesInEntries(recentEntries),
    entryCount: recentEntries.length,
    avgMoodScore: avgMoodScore(recentEntries),
    notes: trends[0] || '',
  };

  const previousSnapshot = {
    periodLabel: 'Previous 30 days',
    periodStart: previousStart.toDate(),
    periodEnd: previousEnd.toDate(),
    dominantMoods: dominantMoodsFromEntries(previousEntries),
    themes: Object.keys(countThemesInEntries(previousEntries)),
    themeCounts: countThemesInEntries(previousEntries),
    entryCount: previousEntries.length,
    avgMoodScore: avgMoodScore(previousEntries),
    notes: '',
  };

  const result = await UserMemory.updateOne(
    { userId, consentEnabled: true },
    { $set: { emotionalSnapshots: [recentSnapshot, previousSnapshot], journalTrends: trends } }
  );
  if (result.matchedCount === 0) return { trends: [], snapshots: [] };

  return { trends, snapshots: [recentSnapshot, previousSnapshot] };
}

function formatMemoryForPrompt(memory, journalData = {}) {
  if (!memory) return '';

  const sections = [];

  if (memory.triggers?.length) {
    sections.push(
      'Known stress triggers:\n' +
        memory.triggers
          .slice(0, 8)
          .map(
            (t) =>
              `- ${t.label}${t.context ? ` (${t.context})` : ''} — last mentioned ${moment(t.lastMentioned).fromNow()}, ${t.mentionCount} time(s)`
          )
          .join('\n')
    );
  }

  if (memory.goals?.length) {
    const activeGoals = memory.goals.filter((g) => g.status === 'active');
    if (activeGoals.length) {
      sections.push(
        'User goals:\n' + activeGoals.slice(0, 6).map((g) => `- ${g.text}`).join('\n')
      );
    }
  }

  if (memory.discussions?.length) {
    sections.push(
      'Previous discussions:\n' +
        memory.discussions
          .slice(-6)
          .map((d) => `- ${moment(d.recordedAt).format('MMM D')}: ${d.summary}`)
          .join('\n')
    );
  }

  const trends = journalData.trends || memory.journalTrends || [];
  if (trends.length) {
    sections.push('Journal emotional trends:\n' + trends.map((t) => `- ${t}`).join('\n'));
  }

  const snapshots = journalData.snapshots || memory.emotionalSnapshots || [];
  const recent = snapshots.find((s) => s.periodLabel === 'Last 30 days');
  if (recent?.entryCount > 0) {
    sections.push(
      `Recent emotional history (${recent.entryCount} journal entries): dominant moods — ${(recent.dominantMoods || []).join(', ') || 'mixed'}; average mood score ${recent.avgMoodScore}/5.`
    );
  }

  if (!sections.length) return '';

  return sections.join('\n\n');
}

function mergeTriggers(existing, incoming) {
  const merged = [...(existing || [])];
  for (const item of incoming || []) {
    const label = String(item.label || item).trim();
    if (!label) continue;
    const idx = merged.findIndex((t) => t.label.toLowerCase() === label.toLowerCase());
    if (idx >= 0) {
      merged[idx].mentionCount += 1;
      merged[idx].lastMentioned = new Date();
      if (item.context) merged[idx].context = item.context;
    } else {
      merged.push({
        label,
        context: item.context || '',
        firstMentioned: new Date(),
        lastMentioned: new Date(),
        mentionCount: 1,
      });
    }
  }
  return merged.slice(-MAX_TRIGGERS);
}

function mergeGoals(existing, incoming) {
  const merged = [...(existing || [])];
  for (const item of incoming || []) {
    const text = String(item.text || item).trim();
    if (!text) continue;
    const exists = merged.some((g) => g.text.toLowerCase() === text.toLowerCase());
    if (!exists) {
      merged.push({
        text,
        status: item.status || 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
  return merged.slice(-MAX_GOALS);
}

function quickExtractFromMessage(text) {
  const lower = String(text || '').toLowerCase();
  const found = [];

  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      found.push({ label: themeLabel(theme), context: text.slice(0, 120) });
    }
  }

  if (/\b(goal|want to|trying to|hope to|plan to)\b/i.test(text)) {
    const goalMatch = text.match(/(?:goal|want to|trying to|hope to|plan to)\s+(.{5,80})/i);
    if (goalMatch) {
      return { triggers: found, goals: [{ text: goalMatch[1].trim() }] };
    }
  }

  return { triggers: found, goals: [] };
}

async function buildMemoryContext(userId) {
  if (!isValidUserId(userId)) return { text: '', memory: null };

  const existingMemory = await UserMemory.findOne({ userId });
  if (!existingMemory?.consentEnabled) {
    return { text: '', memory: existingMemory, journalData: null };
  }
  const journalData = await syncEmotionalHistoryFromJournals(userId);
  const memory = await UserMemory.findOne({ userId });
  const text = formatMemoryForPrompt(memory, journalData);

  return { text, memory, journalData };
}

/** Detect when the user is referring to a prior chat or something said before. */
function userReferencesPastConversation(text) {
  const t = String(text || '').toLowerCase();
  const patterns = [
    /\bremember when\b/,
    /\bremember (that|what|how)\b/,
    /\blast time (we|i|you)\b/,
    /\bwe (talked|spoke|discussed|chatted) about\b/,
    /\b(as|like) (i|we) (said|mentioned|talked about) before\b/,
    /\b(you|we) (said|mentioned|talked about) (earlier|before|last time)\b/,
    /\bearlier (you|we|i)\b/,
    /\bfrom our (last|previous) (chat|conversation)\b/,
    /\bcontinue (where we left|our conversation)\b/,
    /\bpick up where we left\b/,
    /\bwhat did i (say|tell you) about\b/,
    /\bdo you recall\b/,
    /\breferring to (when|what|our)\b/,
    /\babout that (thing|issue|situation) (we|i)\b/,
  ];
  return patterns.some((re) => re.test(t));
}

function formatPastDiscussionsForChat(memory) {
  if (!memory?.discussions?.length) return '';
  const lines = memory.discussions
    .slice(-8)
    .map((d) => `- ${moment(d.recordedAt).format('MMM D, YYYY')}: ${d.summary}`)
    .join('\n');
  return `Recent conversation summaries:\n${lines}`;
}

/**
 * Lightweight memory for chat — only injected when the user references a past conversation.
 */
async function buildMemoryContextForChat(userId, userInput) {
  if (!isValidUserId(userId) || !userReferencesPastConversation(userInput)) {
    return { text: '', memory: null, memoryUsed: false };
  }

  const memory = await UserMemory.findOne({ userId });
  if (!memory?.consentEnabled) return { text: '', memory, memoryUsed: false };
  const text = formatPastDiscussionsForChat(memory);
  return { text, memory, memoryUsed: Boolean(text.trim()) };
}

async function applyMemoryUpdates(userId, updates) {
  if (!isValidUserId(userId) || !updates) return;

  const memory = await getOrCreateMemory(userId);
  if (!memory?.consentEnabled) return;

  if (updates.triggers?.length) {
    memory.triggers = mergeTriggers(memory.triggers, updates.triggers);
  }
  if (updates.goals?.length) {
    memory.goals = mergeGoals(memory.goals, updates.goals);
  }
  if (updates.discussionSummary) {
    const discussions = memory.discussions || [];
    discussions.push({
      summary: updates.discussionSummary.slice(0, 300),
      topics: updates.topics || [],
      userSnippet: updates.userSnippet || '',
      recordedAt: new Date(),
    });
    memory.discussions = discussions.slice(-MAX_DISCUSSIONS);
  }

  await memory.save();
}

function buildDiscussionSummary(userMsg, aiMsg) {
  const snippet = String(userMsg || '').trim().slice(0, 100);
  if (!snippet) return null;
  return `User shared: "${snippet}${userMsg.length > 100 ? '...' : ''}"`;
}

async function updateMemoryFromExchange(userId, userMsg, aiMsg, _model) {
  if (!isValidUserId(userId)) return;

  try {
    const discussionSummary = buildDiscussionSummary(userMsg, aiMsg);
    if (!discussionSummary) return;

    // Store a brief note only — no triggers/goals/AI extraction on every message.
    await applyMemoryUpdates(userId, {
      discussionSummary,
      userSnippet: userMsg.slice(0, 150),
    });
  } catch (err) {
    console.error('[memory] update failed:', err.message);
  }
}

function sanitizeConversationHistory(history) {
  if (!Array.isArray(history)) return [];
  const normalized = history
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({
      role: m.sender === 'user' || m.role === 'user' ? 'user' : 'model',
      content: m.content.trim().slice(0, 2000),
    }));

  // Collapse consecutive same-role turns so Gemini history stays valid.
  const collapsed = [];
  for (const msg of normalized) {
    const last = collapsed[collapsed.length - 1];
    if (last && last.role === msg.role) {
      last.content = `${last.content}\n${msg.content}`.slice(0, 2000);
    } else {
      collapsed.push({ ...msg });
    }
  }

  return collapsed.slice(-20);
}

module.exports = {
  getOrCreateMemory,
  buildMemoryContext,
  buildMemoryContextForChat,
  userReferencesPastConversation,
  syncEmotionalHistoryFromJournals,
  formatMemoryForPrompt,
  updateMemoryFromExchange,
  applyMemoryUpdates,
  sanitizeConversationHistory,
  buildJournalTrends,
};
