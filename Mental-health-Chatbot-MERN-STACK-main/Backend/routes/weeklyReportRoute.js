const express = require('express');
const mongoose = require('mongoose');
const {
  refreshCurrentWeekReport,
  finalizePreviousWeekReport,
  getMondayModalReport,
  markReportSeen,
  getReportHistory,
  getWeekBounds,
  getPreviousWeekBounds,
  isMondayModalWindow,
} = require('../lib/weeklyReport');

const router = express.Router();

/** Live current-week report — regenerates from latest journals, chats, resources */
router.get('/:userId/current', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const { weekKey, weekStart, weekEnd } = getWeekBounds();
    const report = await refreshCurrentWeekReport(userId);

    return res.json({
      report: report ? report.toObject?.() || report : null,
      weekKey,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      tense: 'this',
      message: report
        ? null
        : 'No tracked activity yet this week. Journal, chat, or complete an exercise to build your report.',
    });
  } catch (err) {
    console.error('[weeklyReport] current error:', err);
    return res.status(500).json({ error: 'Failed to refresh weekly report' });
  }
});

/**
 * Monday ≥ 8:00 AM popup payload for the PREVIOUS Monday–Sunday report.
 * Does not show outside that window or after the user has dismissed it.
 */
router.get('/:userId/monday-modal', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const result = await getMondayModalReport(userId);
    const prev = getPreviousWeekBounds();

    return res.json({
      show: result.show,
      reason: result.reason,
      report: result.report,
      inMondayWindow: isMondayModalWindow(),
      previousWeekKey: prev.weekKey,
      previousWeekStart: prev.weekStart.toISOString(),
      previousWeekEnd: prev.weekEnd.toISOString(),
    });
  } catch (err) {
    console.error('[weeklyReport] monday-modal error:', err);
    return res.status(500).json({ error: 'Failed to load Monday report modal' });
  }
});

/** Backward-compatible: refresh current week (same as /current) */
router.get('/:userId/latest', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const report = await refreshCurrentWeekReport(userId);
    return res.json({
      report: report ? report.toObject?.() || report : null,
      unseen: false,
      currentWeekKey: getWeekBounds().weekKey,
    });
  } catch (err) {
    console.error('[weeklyReport] latest error:', err);
    return res.status(500).json({ error: 'Failed to load weekly report' });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const reports = await getReportHistory(userId, Number(req.query.limit) || 16);
    const currentKey = getWeekBounds().weekKey;

    return res.json({
      reports,
      currentWeekKey: currentKey,
      history: reports.filter((r) => r.weekKey !== currentKey || r.finalized),
    });
  } catch (err) {
    console.error('[weeklyReport] history error:', err);
    return res.status(500).json({ error: 'Failed to load report history' });
  }
});

router.post('/:userId/generate', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const report = await refreshCurrentWeekReport(userId);
    if (!report) {
      return res.status(200).json({
        report: null,
        message: 'Not enough activity this week to generate a report yet.',
      });
    }

    return res.json({ report });
  } catch (err) {
    console.error('[weeklyReport] generate error:', err);
    return res.status(500).json({ error: 'Failed to generate weekly report' });
  }
});

router.post('/:userId/finalize-previous', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const report = await finalizePreviousWeekReport(userId);
    return res.json({ report });
  } catch (err) {
    console.error('[weeklyReport] finalize error:', err);
    return res.status(500).json({ error: 'Failed to finalize previous week report' });
  }
});

router.post('/:userId/:reportId/seen', async (req, res) => {
  try {
    const { userId, reportId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const report = await markReportSeen(userId, reportId);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    return res.json({ success: true, report });
  } catch (err) {
    console.error('[weeklyReport] seen error:', err);
    return res.status(500).json({ error: 'Failed to mark report as seen' });
  }
});

module.exports = router;
