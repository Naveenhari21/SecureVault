const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { createAuditLog } = require('../utils/audit');

// Helper to sign JWT
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// ─── POST /api/auth/register ─────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 chars'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { username, email, password, firstName, lastName } = req.body;

      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        const field = existingUser.email === email ? 'Email' : 'Username';
        return res.status(400).json({ success: false, message: `${field} already in use` });
      }

      const user = await User.create({ username, email, password, firstName, lastName });

      await createAuditLog({
        userId: user._id,
        action: 'REGISTER',
        details: `New user registered: ${username}`,
        req,
      });

      const token = signToken(user._id);
      res.status(201).json({
        success: true,
        token,
        user: { id: user._id, username: user.username, email: user.email, role: user.role },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error during registration' });
    }
  }
);

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password');

      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      if (!user.isActive) {
        return res.status(401).json({ success: false, message: 'Account has been deactivated' });
      }

      await createAuditLog({ userId: user._id, action: 'LOGIN', details: 'User logged in', req });

      const token = signToken(user._id);
      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error during login' });
    }
  }
);

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    const { firstName, lastName, username } = req.body;
    const user = await User.findById(req.user._id);

    if (username && username !== user.username) {
      const exists = await User.findOne({ username });
      if (exists) return res.status(400).json({ success: false, message: 'Username already taken' });
      user.username = username;
    }
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined)  user.lastName = lastName;

    await user.save();

    await createAuditLog({
      userId: req.user._id,
      action: 'PROFILE_UPDATE',
      details: 'Profile updated',
      req,
    });

    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
});

// ─── PUT /api/auth/change-password ───────────────────────────────────────────
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Both passwords are required' });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'New password must be at least 6 chars' });

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword)))
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    await createAuditLog({ userId: req.user._id, action: 'PASSWORD_CHANGE', details: 'Password changed', req });
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error changing password' });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', protect, async (req, res) => {
  await createAuditLog({ userId: req.user._id, action: 'LOGOUT', details: 'User logged out', req });
  res.json({ success: true, message: 'Logged out successfully' });
});

// ─── GET /api/auth/users ──────────────────────────────────────────────────────
// Returns all active users (except the caller) for the permission picker.
// Returns only safe fields — no password, no token.
router.get('/users', protect, async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user._id },
      isActive: true,
    })
      .select('username email firstName lastName')
      .sort({ username: 1 })
      .limit(200);

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

// ─── GET /api/auth/users/search ───────────────────────────────────────────────
router.get('/users/search', protect, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2)
      return res.status(400).json({ success: false, message: 'Search query too short' });

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
      _id: { $ne: req.user._id },
      isActive: true,
    }).select('username email firstName lastName').limit(10);

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error searching users' });
  }
});

module.exports = router;
