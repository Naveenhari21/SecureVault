const express = require('express');
const router = express.Router();
const User = require('../models/User');
const File = require('../models/File');
const AuditLog = require('../models/AuditLog');
const Permission = require('../models/Permission');
const FileVersion = require('../models/FileVersion');
const { protect, adminOnly } = require('../middleware/auth');
const { createAuditLog } = require('../utils/audit');
const fs = require('fs');

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalFiles, totalLogs, activeUsers, deletedFiles] = await Promise.all([
      User.countDocuments(),
      File.countDocuments(),
      AuditLog.countDocuments(),
      User.countDocuments({ isActive: true }),
      File.countDocuments({ isDeleted: true }),
    ]);

    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    // Storage used (sum of all file sizes)
    const storageResult = await File.aggregate([
      { $group: { _id: null, totalSize: { $sum: '$size' } } }
    ]);
    const totalStorage = storageResult[0]?.totalSize || 0;

    // Most active users by file upload
    const topUploaders = await File.aggregate([
      { $group: { _id: '$owner', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { username: '$user.username', email: '$user.email', count: 1 } }
    ]);

    // Action breakdown
    const actionBreakdown = await AuditLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalFiles,
        deletedFiles,
        totalLogs,
        newUsersThisWeek,
        totalStorage,
        topUploaders,
        actionBreakdown,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching admin stats' });
  }
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 15 } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    // Attach file count per user
    const userIds = users.map(u => u._id);
    const fileCounts = await File.aggregate([
      { $match: { owner: { $in: userIds } } },
      { $group: { _id: '$owner', count: { $sum: 1 } } }
    ]);
    const fileCountMap = {};
    fileCounts.forEach(f => { fileCountMap[f._id.toString()] = f.count; });

    const usersWithMeta = users.map(u => ({
      ...u.toObject(),
      fileCount: fileCountMap[u._id.toString()] || 0
    }));

    res.json({ success: true, users: usersWithMeta, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

// ─── PUT /api/admin/users/:id/toggle-status ───────────────────────────────────
router.put('/users/:id/toggle-status', async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate your own account' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();

    await createAuditLog({
      userId: req.user._id,
      action: user.isActive ? 'PROFILE_UPDATE' : 'PROFILE_UPDATE',
      details: `Admin ${req.user.username} ${user.isActive ? 'activated' : 'deactivated'} user: ${user.username}`,
      req,
    });

    res.json({ success: true, user, message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error toggling user status' });
  }
});

// ─── PUT /api/admin/users/:id/role ────────────────────────────────────────────
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot change your own role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await createAuditLog({
      userId: req.user._id,
      details: `Admin changed ${user.username}'s role to ${role}`,
      action: 'PERMISSION_CHANGE',
      req,
    });

    res.json({ success: true, user, message: `Role updated to ${role}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating role' });
  }
});

// ─── DELETE /api/admin/users/:id ─────────────────────────────────────────────
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Soft delete all their files
    await File.updateMany({ owner: req.params.id }, { isDeleted: true, deletedAt: new Date() });
    // Remove their permissions
    await Permission.deleteMany({ user: req.params.id });
    // Delete the user
    await User.findByIdAndDelete(req.params.id);

    await createAuditLog({
      userId: req.user._id,
      action: 'FILE_DELETE',
      details: `Admin deleted user account: ${user.username} (${user.email})`,
      req,
    });

    res.json({ success: true, message: `User ${user.username} deleted successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
});

// ─── GET /api/admin/files ─────────────────────────────────────────────────────
router.get('/files', async (req, res) => {
  try {
    const { search, owner, page = 1, limit = 15 } = req.query;

    // For admin, we need to see all files including deleted ones
    const rawQuery = {};
    if (search) rawQuery.originalName = { $regex: search, $options: 'i' };
    if (owner) rawQuery.owner = owner;

    // Use setOptions to bypass the soft-delete middleware
    const files = await File.find(rawQuery)
      .setOptions({ includeDeleted: true })
      .populate('owner', 'username email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await File.countDocuments(rawQuery).setOptions({ includeDeleted: true });

    res.json({ success: true, files, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching files' });
  }
});

// ─── DELETE /api/admin/files/:id ──────────────────────────────────────────────
router.delete('/files/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id).setOptions({ includeDeleted: true });
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });

    // Delete physical encrypted file
    if (fs.existsSync(file.encryptedPath)) {
      fs.unlinkSync(file.encryptedPath);
    }

    // Delete all version files too
    const versions = await FileVersion.find({ file: file._id });
    for (const v of versions) {
      if (fs.existsSync(v.encryptedPath)) {
        fs.unlinkSync(v.encryptedPath);
      }
    }

    await FileVersion.deleteMany({ file: file._id });
    await Permission.deleteMany({ file: file._id });
    await File.findByIdAndDelete(file._id);

    await createAuditLog({
      userId: req.user._id,
      action: 'FILE_DELETE',
      details: `Admin permanently deleted file: ${file.originalName}`,
      req,
    });

    res.json({ success: true, message: 'File permanently deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error deleting file' });
  }
});

// ─── GET /api/admin/logs ──────────────────────────────────────────────────────
router.get('/logs', async (req, res) => {
  try {
    const { action, userId, page = 1, limit = 25, startDate, endDate } = req.query;
    const query = {};
    if (action) query.action = action;
    if (userId) query.user = userId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate)   query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('user', 'username email')
      .populate('file', 'originalName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(query);
    res.json({ success: true, logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching logs' });
  }
});

module.exports = router;
