const express = require('express');
const router = express.Router();
const fs = require('fs');
const FileVersion = require('../models/FileVersion');
const Permission = require('../models/Permission');
const { protect } = require('../middleware/auth');
const { decryptFile } = require('../utils/encryption');
const { createAuditLog } = require('../utils/audit');

// ─── Helper ───────────────────────────────────────────────────────────────────
const hasPermission = async (fileId, userId, required) => {
  const perm = await Permission.findOne({ file: fileId, user: userId });
  if (!perm) return false;
  const levels = { none: 0, view: 1, edit: 2, owner: 3 };
  return levels[perm.permission] >= levels[required];
};

// ─── GET /api/versions/:fileId ────────────────────────────────────────────────
router.get('/:fileId', protect, async (req, res) => {
  try {
    const allowed = await hasPermission(req.params.fileId, req.user._id, 'view');
    if (!allowed) return res.status(403).json({ success: false, message: 'Access denied' });

    const versions = await FileVersion.find({ file: req.params.fileId })
      .populate('uploadedBy', 'username email')
      .sort({ versionNumber: -1 });

    res.json({ success: true, versions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching versions' });
  }
});

// ─── GET /api/versions/:fileId/:versionId/download ────────────────────────────
router.get('/:fileId/:versionId/download', protect, async (req, res) => {
  try {
    const allowed = await hasPermission(req.params.fileId, req.user._id, 'view');
    if (!allowed) return res.status(403).json({ success: false, message: 'Access denied' });

    const version = await FileVersion.findOne({
      _id: req.params.versionId,
      file: req.params.fileId,
    });

    if (!version) return res.status(404).json({ success: false, message: 'Version not found' });

    const encryptedBuffer = fs.readFileSync(version.encryptedPath);
    const decryptedBuffer = decryptFile(encryptedBuffer, version.iv);

    await createAuditLog({
      userId: req.user._id,
      action: 'VERSION_DOWNLOAD',
      fileId: req.params.fileId,
      details: `Downloaded version ${version.versionNumber} of ${version.originalName}`,
      req,
    });

    res.setHeader('Content-Disposition', `attachment; filename="v${version.versionNumber}_${version.originalName}"`);
    res.setHeader('Content-Type', version.mimeType);
    res.setHeader('Content-Length', decryptedBuffer.length);
    res.send(decryptedBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Version download failed' });
  }
});

module.exports = router;
