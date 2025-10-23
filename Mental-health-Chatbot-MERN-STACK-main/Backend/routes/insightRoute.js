const MoodEntry = require('../models/MoodEntry');
const moment = require('moment');
const express = require('express');
const router = express.Router();

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    console.log('Processing request for userId:', userId);

    const now = moment().endOf('day');
    const sevenDaysAgo = moment().subtract(6, 'days').startOf('day');
    const thirtyDaysAgo = moment().subtract(29, 'days').startOf('day');
    
    console.log('Date calculations:', {
      now: now.format('YYYY-MM-DD HH:mm:ss'),
      sevenDaysAgo: sevenDaysAgo.format('YYYY-MM-DD HH:mm:ss'),
      thirtyDaysAgo: thirtyDaysAgo.format('YYYY-MM-DD HH:mm:ss')
    });

    // Fetch all relevant entries
    console.log('Querying for userId:', userId);
    
    let allEntries, weeklyEntries, monthlyEntries;
    
    try {
      [allEntries, weeklyEntries, monthlyEntries] = await Promise.all([
        MoodEntry.find({ userId }),
        MoodEntry.find({ userId, date: { $gte: sevenDaysAgo.toDate(), $lte: now.toDate() } }),
        MoodEntry.find({ userId, date: { $gte: thirtyDaysAgo.toDate(), $lte: now.toDate() } }),
      ]);
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return res.status(500).json({ error: 'Failed to fetch journal entries' });
    }

    console.log('Date ranges:', {
      sevenDaysAgo: sevenDaysAgo.format('YYYY-MM-DD'),
      now: now.format('YYYY-MM-DD'),
      thirtyDaysAgo: thirtyDaysAgo.format('YYYY-MM-DD')
    });
    console.log('Entries found:', {
      all: allEntries.length,
      weekly: weeklyEntries.length,
      monthly: monthlyEntries.length
    });
    
    if (allEntries.length > 0) {
      console.log('Sample entry:', allEntries[0]);
      console.log('Sample entry date:', allEntries[0].date);
      console.log('Sample entry date type:', typeof allEntries[0].date);
    }

    // 1. Weekly Average Mood
    const moodScale = {
      angry: 1,
      sad: 2,
      anxious: 3,
      tired: 3,
      calm: 4,
      grateful: 4,
      happy: 5,
      excited: 5
    };

    const weeklyMoodValues = weeklyEntries.map(e => moodScale[e.mood.toLowerCase()] || 0);
    const weeklyAverage = weeklyMoodValues.length
      ? (weeklyMoodValues.reduce((sum, val) => sum + val, 0) / weeklyMoodValues.length)
      : 0;

    const averageMoodLabel = getMoodLabelFromValue(weeklyAverage);

    // 2. Most Frequent Mood (Monthly)
    const moodFreq = {};
    monthlyEntries.forEach(entry => {
      const mood = entry.mood.toLowerCase();
      moodFreq[mood] = (moodFreq[mood] || 0) + 1;
    });

    const mostFrequentMood = Object.entries(moodFreq).reduce(
      (acc, [mood, count]) => count > acc.count ? { mood, count } : acc,
      { mood: null, count: 0 }
    );

    // 3. Journal Entry Stats
    const totalEntries = allEntries.length;
    const weeklyEntriesCount = weeklyEntries.length;

    // 4. Longest Streak Calculation
    const sortedDates = allEntries
      .map(e => moment(e.date).startOf('day').format('YYYY-MM-DD'))
      .filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
      .sort();

    let maxStreak = 0;
    let currentStreak = 0;
    let previousDate = null;

    sortedDates.forEach(dateStr => {
      const date = moment(dateStr);
      if (!previousDate || date.diff(previousDate, 'days') === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
      previousDate = date;
    });

    // Fetch previous week's entries (8–14 days ago)
    const previousWeekStart = moment().subtract(13, 'days').startOf('day');
    const previousWeekEnd = moment().subtract(7, 'days').endOf('day');

    const previousWeekEntries = await MoodEntry.find({
    userId,
    date: { $gte: previousWeekStart.toDate(), $lte: previousWeekEnd.toDate() }
    });

    // Calculate average values
    const getAverageMoodValue = entries => {
    const values = entries.map(e => moodScale[e.mood.toLowerCase()] || 0);
    return values.length ? (values.reduce((sum, v) => sum + v, 0) / values.length) : 0;
    };

    const currentAvg = getAverageMoodValue(weeklyEntries);
    const previousAvg = getAverageMoodValue(previousWeekEntries);

    let improvement = null;
    if (previousAvg > 0) {
        improvement = (((currentAvg - previousAvg) / previousAvg) * 100).toFixed(1) + '%';
    } else if (currentAvg > 0) {
        improvement = '100%'; // First week with data
    } else {
        improvement = '0%';
    }

    // Generate weekly mood data for charts
    const weeklyMoodData = generateWeeklyMoodData(weeklyEntries, moodScale);
    console.log('Generated weekly mood data:', weeklyMoodData);
    
    // Generate monthly mood data for charts
    const monthlyMoodData = generateMonthlyMoodData(monthlyEntries);
    console.log('Generated monthly mood data:', monthlyMoodData);
    
    // Generate personalized insights
    const personalizedInsights = generatePersonalizedInsights(weeklyEntries, monthlyEntries, allEntries, moodScale);
    console.log('Generated personalized insights:', personalizedInsights);
    console.log('Mood scale used:', moodScale);
    console.log('Weekly entries for insights:', weeklyEntries.length);
    console.log('Monthly entries for insights:', monthlyEntries.length);
    
    // Ensure we always return valid chart data
    if (!weeklyMoodData || weeklyMoodData.length === 0) {
      console.log('No weekly mood data generated, using fallback');
    }
    
    if (!monthlyMoodData || monthlyMoodData.length === 0) {
      console.log('No monthly mood data generated, using fallback');
    }
    
    // If no entries at all, provide helpful message
    if (allEntries.length === 0) {
      console.log('No journal entries found for user');
      // Return empty data structure but don't error
      return res.status(200).json({
        weeklyAverageMood: {
          label: "No Data",
          value: "0",
          improvement: "0%"
        },
        mostFrequentMood: {
          mood: "No Data",
          count: 0,
          emoji: "📝"
        },
        journalEntries: {
          total: 0,
          thisWeek: 0,
          change: "0%"
        },
        streak: {
          consecutiveDays: 0
        },
        weeklyMoodData: [],
        monthlyMoodData: [],
        personalizedInsights: []
      });
    }

    // console.log("WEekly average mood:", averageMoodLabel);

    // Response
    return res.status(200).json({
      weeklyAverageMood: {
        label: averageMoodLabel,
        value: weeklyAverage.toFixed(2), // optional: for display
        improvement
      },
      mostFrequentMood: {
        mood: capitalize(mostFrequentMood.mood),
        count: mostFrequentMood.count,
        emoji: moodToEmoji(mostFrequentMood.mood)
      },
      journalEntries: {
        total: totalEntries,
        thisWeek: weeklyEntriesCount,
        change: "-25%" // placeholder
      },
      streak: {
        consecutiveDays: maxStreak
      },
      weeklyMoodData,
      monthlyMoodData,
      personalizedInsights
    });

  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate weekly mood data for charts
function generateWeeklyMoodData(weeklyEntries, moodScale) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Get the current week's start (Monday) and end (Sunday)
  const now = moment();
  const weekStart = now.clone().startOf('week').add(1, 'day'); // Monday
  
  return days.map((day, index) => {
    const targetDate = weekStart.clone().add(index, 'days');
    console.log(`Looking for entries on ${day} (${targetDate.format('YYYY-MM-DD')})`);
    
    const dayEntries = weeklyEntries.filter(entry => {
      const entryDate = moment(entry.date);
      const isSame = entryDate.isSame(targetDate, 'day');
      console.log(`  Entry date: ${entryDate.format('YYYY-MM-DD')}, matches ${day}: ${isSame}`);
      return isSame;
    });

    if (dayEntries.length === 0) {
      return { day, value: 3, mood: 'neutral' };
    }

    const avgMood = dayEntries.reduce((sum, entry) => 
      sum + (moodScale[entry.mood.toLowerCase()] || 3), 0
    ) / dayEntries.length;

    return {
      day,
      value: Math.round(avgMood),
      mood: dayEntries[0].mood
    };
  });
}

// Generate monthly mood data for charts
function generateMonthlyMoodData(monthlyEntries) {
  console.log('Generating monthly data from entries:', monthlyEntries);
  
  const moodCounts = {};
  monthlyEntries.forEach(entry => {
    const mood = entry.mood;
    moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    console.log(`Processing mood: ${mood}, count: ${moodCounts[mood]}`);
  });

  const result = Object.entries(moodCounts).map(([mood, count]) => ({
    name: capitalize(mood),
    value: count
  }));
  
  console.log('Generated monthly mood data:', result);
  return result;
}

// Helpers
function getMoodLabelFromValue(value) {
  if (value >= 4.5) return "Excellent";
  if (value >= 4) return "Good";
  if (value >= 3) return "Okay";
  if (value >= 2) return "Low";
  if (value > 0) return "Poor";
  return "No Data";
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function moodToEmoji(mood) {
  const emojiMap = {
    happy: '😊',
    sad: '😢',
    angry: '😡',
    anxious: '😰',
    tired: '😴',
    calm: '😌',
    grateful: '🙏',
    excited: '😄'
  };
  return emojiMap[mood?.toLowerCase()] || '🙂';
}

// Generate personalized insights based on journal entries
function generatePersonalizedInsights(weeklyEntries, monthlyEntries, allEntries, moodScale) {
  console.log('Generating insights with:', { weeklyEntries: weeklyEntries.length, monthlyEntries: monthlyEntries.length, allEntries: allEntries.length, moodScale });
  
  const insights = [];
  
  // Mood patterns insight
  if (weeklyEntries.length > 0) {
    const moodCounts = {};
    weeklyEntries.forEach(entry => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });
    
    console.log('Mood counts for the week:', moodCounts);
    
    const mostFrequentMood = Object.keys(moodCounts).reduce((a, b) => 
      moodCounts[a] > moodCounts[b] ? a : b, 'happy'
    );
    
    if (moodCounts['anxious'] > 0) {
      insights.push({
        type: 'mood-patterns',
        title: 'Mood Patterns',
        description: 'Based on your journal entries',
        content: `You've felt anxious ${moodCounts['anxious']} days this week. Consider scheduling short breaks during your workday to practice MoodIntelness.`,
        icon: 'Lightbulb',
        color: 'primary'
      });
    }
    
    if (moodCounts['sad'] > 0) {
      insights.push({
        type: 'mood-patterns',
        title: 'Mood Patterns',
        description: 'Based on your journal entries',
        content: `You've felt sad ${moodCounts['sad']} days this week. Consider reaching out to friends or family for support.`,
        icon: 'Lightbulb',
        color: 'primary'
      });
    }
  }
  
  // Progress insight
  if (weeklyEntries.length > 0) {
    const weeklyAvg = weeklyEntries.reduce((sum, entry) => {
      return sum + (moodScale[entry.mood.toLowerCase()] || 3);
    }, 0) / weeklyEntries.length;
    
    if (weeklyAvg >= 4) {
      insights.push({
        type: 'progress',
        title: 'Progress Insight',
        description: 'Your weekly improvement',
        content: 'Your overall mood has been positive this week. Your journaling consistency is making a difference in your emotional awareness.',
        icon: 'TrendingUp',
        color: 'amber'
      });
    } else if (weeklyAvg <= 2) {
      insights.push({
        type: 'progress',
        title: 'Progress Insight',
        description: 'Your weekly improvement',
        content: 'You\'ve had some challenging days this week. Remember that it\'s okay to not be okay, and consider talking to someone you trust.',
        icon: 'TrendingUp',
        color: 'amber'
      });
    }
  }
  
  // Goal tracking insight
  if (allEntries.length > 0) {
    const consecutiveDays = calculateConsecutiveDays(allEntries);
    const weeklyGoal = Math.min(consecutiveDays, 7);
    const monthlyGoal = Math.min(monthlyEntries.length, 30);
    const positiveEntries = weeklyEntries.filter(e => ['happy', 'excited', 'grateful'].includes(e.mood)).length;
    
    insights.push({
      type: 'goals',
      title: 'Goal Tracking',
      description: 'Progress toward your mental health goals',
      goals: [
        { name: 'Daily MoodIntelness', current: weeklyGoal, target: 7, percentage: Math.round((weeklyGoal / 7) * 100) },
        { name: 'Journal Entries', current: weeklyEntries.length, target: 7, percentage: Math.round((weeklyEntries.length / 7) * 100) },
        { name: 'Positive Reflection', current: positiveEntries, target: 5, percentage: Math.round((positiveEntries / 5) * 100) }
      ],
      icon: 'Target',
      color: 'teal'
    });
  }
  
  // Content-based insights
  if (weeklyEntries.length > 0) {
    const content = weeklyEntries.map(entry => entry.content.toLowerCase()).join(' ');
    
    if (content.includes('work') || content.includes('stress') || content.includes('anxious')) {
      insights.push({
        type: 'content-analysis',
        title: 'Work-Life Balance',
        description: 'Based on your journal content',
        content: 'You\'ve mentioned work-related stress several times this week. Consider setting boundaries and taking regular breaks.',
        icon: 'Lightbulb',
        color: 'primary'
      });
    }
    
    if (content.includes('sleep') || content.includes('tired') || content.includes('exhausted')) {
      insights.push({
        type: 'content-analysis',
        title: 'Sleep Quality',
        description: 'Based on your journal content',
        content: 'You\'ve mentioned feeling tired or exhausted. Consider improving your sleep hygiene and bedtime routine.',
        icon: 'Lightbulb',
        color: 'primary'
      });
    }
    
    if (content.includes('alone') || content.includes('lonely') || content.includes('isolated')) {
      insights.push({
        type: 'content-analysis',
        title: 'Social Connection',
        description: 'Based on your journal content',
        content: 'You\'ve mentioned feeling isolated. Consider scheduling social activities or reaching out to friends.',
        icon: 'Lightbulb',
        color: 'primary'
      });
    }
  }
  
  // If no specific insights, provide general encouragement
  if (insights.length === 0) {
    insights.push({
      type: 'general',
      title: 'Getting Started',
      description: 'Welcome to your mental health journey',
      content: 'Keep journaling regularly to unlock personalized insights and track your emotional patterns.',
      icon: 'Lightbulb',
      color: 'primary'
    });
  }
  
  return insights;
}

// Calculate consecutive days (helper function)
function calculateConsecutiveDays(allEntries) {
  const sortedEntries = allEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
  let consecutiveDays = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const hasEntry = sortedEntries.some(entry => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === currentDate.getTime();
    });
    if (hasEntry) {
      consecutiveDays++;
    } else {
      break;
    }
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return consecutiveDays;
}

module.exports = router;
