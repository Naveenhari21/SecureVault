const AuditLog = require('../models/AuditLog');

/**
 * Create an audit log entry.
 * @param {Object} params
 * @param {string} params.userId - The user performing the action
 * @param {string} params.action - Action enum value
 * @param {string} [params.fileId] - Optional file reference
 * @param {string} [params.details] - Human-readable details
 * @param {Object} [params.req] - Express request object (for IP/UA)
 */
const createAuditLog = async ({ userId, action, fileId = null, details = '', req = null }) => {
  try {
    const logData = {
      user: userId,
      action,
      file: fileId,
      details,
    };

    if (req) {
      logData.ipAddress =
        req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.ip || '';
      logData.userAgent = req.headers['user-agent'] || '';
    }

    await AuditLog.create(logData);
  } catch (err) {
    // Don't let audit log failures break the main flow
    console.error('Audit log error:', err.message);
  }
};

module.exports = { createAuditLog };
