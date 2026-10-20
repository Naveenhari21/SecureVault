const express = require('express');
const router = express.Router();
const Permission = require('../models/Permission');
const File = require('../models/File');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { createAuditLog } = require('../utils/audit');

// ─── Helper — verify owner ────────────────────────────────────────────────────
const isOwner = async (fileId, userId) => {
  const perm = await Permission.findOne({ file: fileId, user: userId, permission: 'owner' });
  return !!perm;
};

// ─── GET /api/permissions/:fileId ─────────────────────────────────────────────
router.get('/:fileId', protect, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });

    const owner = await isOwner(file._id, req.user._id);
    if (!owner) return res.status(403).json({ success: false, message: 'Only owner can view permissions' });

    const permissions = await Permission.find({ file: file._id })
      .populate('user', 'username email firstName lastName')
      .populate('grantedBy', 'username email');

    res.json({ success: true, permissions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching permissions' });
  }
});

// ─── POST /api/permissions/:fileId ────────────────────────────────────────────
router.post('/:fileId', protect, async (req, res) => {
  try {
    const { userId, permission } = req.body;
    if (!userId || !permission)
      return res.status(400).json({ success: false, message: 'userId and permission are required' });

    const validPerms = ['view', 'edit', 'none'];
    if (!validPerms.includes(permission))
      return res.status(400).json({ success: false, message: 'Invalid permission level' });

    const file = await File.findById(req.params.fileId);
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });

    const owner = await isOwner(file._id, req.user._id);
    if (!owner) return res.status(403).json({ success: false, message: 'Only owner can grant permissions' });

    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ success: false, message: 'Target user not found' });

    // Don't allow changing owner's own permission
    if (userId === req.user._id.toString())
      return res.status(400).json({ success: false, message: 'Cannot change your own owner permission' });

    const existing = await Permission.findOne({ file: file._id, user: userId });
    let perm;
    if (existing) {
      existing.permission = permission;
      existing.grantedBy  = req.user._id;
      perm = await existing.save();
      await createAuditLog({
        userId: req.user._id,
        action: 'PERMISSION_CHANGE',
        fileId: file._id,
        details: `Changed ${targetUser.username}'s permission to ${permission} on ${file.originalName}`,
        req,
      });
    } else {
      perm = await Permission.create({
        file: file._id,
        user: userId,
        permission,
        grantedBy: req.user._id,
      });
      await createAuditLog({
        userId: req.user._id,
        action: 'FILE_SHARE',
        fileId: file._id,
        details: `Shared ${file.originalName} with ${targetUser.username} (${permission})`,
        req,
      });
    }

    res.json({ success: true, permission: perm });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error updating permission' });
  }
});

// ─── DELETE /api/permissions/:fileId/:userId ──────────────────────────────────
router.delete('/:fileId/:userId', protect, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });

    const owner = await isOwner(file._id, req.user._id);
    if (!owner) return res.status(403).json({ success: false, message: 'Only owner can revoke permissions' });

    if (req.params.userId === req.user._id.toString())
      return res.status(400).json({ success: false, message: 'Cannot revoke own owner permission' });

    await Permission.findOneAndDelete({ file: file._id, user: req.params.userId });

    const targetUser = await User.findById(req.params.userId);
    await createAuditLog({
      userId: req.user._id,
      action: 'PERMISSION_REVOKE',
      fileId: file._id,
      details: `Revoked access for ${targetUser?.username || req.params.userId} on ${file.originalName}`,
      req,
    });

    res.json({ success: true, message: 'Permission revoked' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error revoking permission' });
  }
});

module.exports = router;
