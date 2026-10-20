const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const File = require('../models/File');
const FileVersion = require('../models/FileVersion');
const Permission = require('../models/Permission');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { encryptFile, decryptFile } = require('../utils/encryption');
const { createAuditLog } = require('../utils/audit');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ─── Helpers ─────────────────────────────────────────────────────────────────
const hasPermission = async (fileId, userId, required) => {
  const perm = await Permission.findOne({ file: fileId, user: userId });
  if (!perm) return false;
  const levels = { none: 0, view: 1, edit: 2, owner: 3 };
  return levels[perm.permission] >= levels[required];
};

// ─── POST /api/files/upload ───────────────────────────────────────────────────
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file provided' });

    const { originalname, buffer, mimetype, size } = req.file;
    const { description, tags } = req.body;

    // Encrypt
    const { encryptedBuffer, iv } = encryptFile(buffer);
    const storedName = `${uuidv4()}.enc`;
    const encryptedPath = path.join(UPLOAD_DIR, storedName);
    fs.writeFileSync(encryptedPath, encryptedBuffer);

    // Save file record
    const file = await File.create({
      originalName: originalname,
      storedName,
      encryptedPath,
      iv,
      mimeType: mimetype,
      size,
      owner: req.user._id,
      description: description || '',
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      currentVersion: 1,
    });

    // Owner permission
    await Permission.create({ file: file._id, user: req.user._id, permission: 'owner', grantedBy: req.user._id });

    // First version record
    await FileVersion.create({
      file: file._id,
      versionNumber: 1,
      encryptedPath,
      iv,
      storedName,
      originalName: originalname,
      size,
      mimeType: mimetype,
      uploadedBy: req.user._id,
      comment: 'Initial version',
    });

    await createAuditLog({
      userId: req.user._id,
      action: 'FILE_UPLOAD',
      fileId: file._id,
      details: `Uploaded file: ${originalname}`,
      req,
    });

    res.status(201).json({ success: true, file });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || 'Upload failed' });
  }
});

// ─── GET /api/files ───────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { search, tag, page = 1, limit = 20 } = req.query;
    const query = { owner: req.user._id };
    if (search) query.originalName = { $regex: search, $options: 'i' };
    if (tag)    query.tags = tag.toLowerCase();

    const files = await File.find(query)
      .populate('owner', 'username email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await File.countDocuments(query);
    res.json({ success: true, files, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching files' });
  }
});

// ─── GET /api/files/shared ────────────────────────────────────────────────────
router.get('/shared', protect, async (req, res) => {
  try {
    const perms = await Permission.find({
      user: req.user._id,
      permission: { $in: ['view', 'edit'] },
    }).populate({
      path: 'file',
      populate: { path: 'owner', select: 'username email' },
    });

    const files = perms.map((p) => ({ ...p.file?.toObject(), myPermission: p.permission })).filter((f) => f._id);
    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching shared files' });
  }
});

// ─── GET /api/files/:id ───────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const file = await File.findById(req.params.id).populate('owner', 'username email firstName lastName');
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });

    const allowed = await hasPermission(file._id, req.user._id, 'view');
    if (!allowed) return res.status(403).json({ success: false, message: 'Access denied' });

    const perm = await Permission.findOne({ file: file._id, user: req.user._id });
    res.json({ success: true, file, myPermission: perm?.permission });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching file' });
  }
});

// ─── GET /api/files/:id/download ─────────────────────────────────────────────
router.get('/:id/download', protect, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });

    const allowed = await hasPermission(file._id, req.user._id, 'view');
    if (!allowed) return res.status(403).json({ success: false, message: 'Access denied' });

    const encryptedBuffer = fs.readFileSync(file.encryptedPath);
    const decryptedBuffer = decryptFile(encryptedBuffer, file.iv);

    await createAuditLog({
      userId: req.user._id,
      action: 'FILE_DOWNLOAD',
      fileId: file._id,
      details: `Downloaded: ${file.originalName}`,
      req,
    });

    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', decryptedBuffer.length);
    res.send(decryptedBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Download failed' });
  }
});

// ─── PUT /api/files/:id ───────────────────────────────────────────────────────
router.put('/:id', protect, upload.single('file'), async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });

    const allowed = await hasPermission(file._id, req.user._id, 'edit');
    if (!allowed) return res.status(403).json({ success: false, message: 'Edit access required' });

    const { description, tags, comment } = req.body;
    if (description !== undefined) file.description = description;
    if (tags !== undefined)        file.tags = tags.split(',').map((t) => t.trim()).filter(Boolean);

    // If a new file buffer is provided, create a new version
    if (req.file) {
      const { buffer, originalname, mimetype, size } = req.file;
      const { encryptedBuffer, iv } = encryptFile(buffer);
      const storedName = `${uuidv4()}.enc`;
      const encryptedPath = path.join(UPLOAD_DIR, storedName);
      fs.writeFileSync(encryptedPath, encryptedBuffer);

      file.currentVersion += 1;
      file.encryptedPath  = encryptedPath;
      file.iv             = iv;
      file.storedName     = storedName;
      file.originalName   = originalname;
      file.mimeType       = mimetype;
      file.size           = size;

      await FileVersion.create({
        file: file._id,
        versionNumber: file.currentVersion,
        encryptedPath,
        iv,
        storedName,
        originalName: originalname,
        size,
        mimeType: mimetype,
        uploadedBy: req.user._id,
        comment: comment || `Version ${file.currentVersion}`,
      });

      await createAuditLog({
        userId: req.user._id,
        action: 'VERSION_UPLOAD',
        fileId: file._id,
        details: `Uploaded version ${file.currentVersion} of ${originalname}`,
        req,
      });
    }

    await file.save();

    await createAuditLog({
      userId: req.user._id,
      action: 'FILE_UPDATE',
      fileId: file._id,
      details: `Updated metadata for: ${file.originalName}`,
      req,
    });

    res.json({ success: true, file });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

// ─── DELETE /api/files/:id ────────────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });

    const isOwner = await hasPermission(file._id, req.user._id, 'owner');
    if (!isOwner) return res.status(403).json({ success: false, message: 'Only owner can delete' });

    file.isDeleted = true;
    file.deletedAt = new Date();
    await file.save();

    await createAuditLog({
      userId: req.user._id,
      action: 'FILE_DELETE',
      fileId: file._id,
      details: `Deleted file: ${file.originalName}`,
      req,
    });

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

// ─── GET /api/files/dashboard/stats ──────────────────────────────────────────
router.get('/dashboard/stats', protect, async (req, res) => {
  try {
    const [myFiles, sharedPerms, recentLogs] = await Promise.all([
      File.countDocuments({ owner: req.user._id }),
      Permission.countDocuments({ user: req.user._id, permission: { $in: ['view', 'edit'] } }),
      File.find({ owner: req.user._id }).sort({ createdAt: -1 }).limit(5).populate('owner', 'username'),
    ]);

    res.json({ success: true, stats: { myFiles, sharedWithMe: sharedPerms, recentDocuments: recentLogs } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
});

module.exports = router;
