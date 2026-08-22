const moment = require('moment');
const MoodEntry = require('../models/MoodEntry');

function uniqueSortedJournalDates(entries) {
  return entries
    .map((e) => moment(e.date).startOf('day').format('YYYY-MM-DD'))
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();
}

/**
 * Current active streak: consecutive days ending today or yesterday.
 */
function computeCurrentStreak(sortedDates) {
  if (!sortedDates.length) return 0;

  const today = moment().startOf('day');
  const yesterday = moment().subtract(1, 'day').startOf('day');
  const lastDate = moment(sortedDates[sortedDates.length - 1]).startOf('day');

  if (!lastDate.isSame(today, 'day') && !lastDate.isSame(yesterday, 'day')) {
    return 0;
  }

  let streak = 1;
  for (let i = sortedDates.length - 2; i >= 0; i -= 1) {
    const d = moment(sortedDates[i]).startOf('day');
    const next = moment(sortedDates[i + 1]).startOf('day');
    if (next.diff(d, 'days') === 1) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

function hasJournalEntryToday(sortedDates) {
  const today = moment().startOf('day').format('YYYY-MM-DD');
  return sortedDates.includes(today);
}

async function getJournalStreakStatus(userId) {
  const entries = await MoodEntry.find({ userId }).select('date').lean();
  const sortedDates = uniqueSortedJournalDates(entries);
  const currentStreak = computeCurrentStreak(sortedDates);
  const journaledToday = hasJournalEntryToday(sortedDates);

  return {
    currentStreak,
    journaledToday,
    sortedDates,
  };
}

module.exports = {
  uniqueSortedJournalDates,
  computeCurrentStreak,
  hasJournalEntryToday,
  getJournalStreakStatus,
};
