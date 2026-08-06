const express = require('express');
const mongoose = require('mongoose');
const {
  generateWeeklyReportForUser,
  getLatestReport,
  markReportSeen,
  getReportHistory,
  getWeekBounds,
} = require('../lib/weeklyReport');

const router = express.Router();

router.get('/:userId/latest', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const { weekKey } = getWeekBounds();
    let report = await getLatestReport(userId);

    if (!report || report.weekKey !== weekKey) {
      const generated = await generateWeeklyReportForUser(userId);
      report = generated ? generated.toObject?.() || generated : report;
    }

    if (!report) {
      return res.json({ report: null, unseen: false });
    }

    return res.json({
      report,
      unseen: !report.seenAt,
      currentWeekKey: weekKey,
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

    const reports = await getReportHistory(userId, Number(req.query.limit) || 12);
    return res.json({ reports });
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

    const report = await generateWeeklyReportForUser(userId);
    if (!report) {
      return res.status(200).json({
        report: null,
        message: 'Not enough journal or chat data to generate a report yet.',
      });
    }

    return res.json({ report });
  } catch (err) {
    console.error('[weeklyReport] generate error:', err);
    return res.status(500).json({ error: 'Failed to generate weekly report' });
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
