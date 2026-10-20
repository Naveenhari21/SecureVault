const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');

// ─── GET /api/logs ────────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { action, fileId, page = 1, limit = 30, startDate, endDate } = req.query;

    const query = { user: req.user._id };
    if (action) query.action = action;
    if (fileId) query.file  = fileId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate)   query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('file', 'originalName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      logs,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching logs' });
  }
});

// ─── GET /api/logs/file/:fileId ────────────────────────────────────────────────
router.get('/file/:fileId', protect, async (req, res) => {
  try {
    const Permission = require('../models/Permission');
    const perm = await Permission.findOne({ file: req.params.fileId, user: req.user._id });
    if (!perm) return res.status(403).json({ success: false, message: 'Access denied' });

    const logs = await AuditLog.find({ file: req.params.fileId })
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching file logs' });
  }
});

module.exports = router;
