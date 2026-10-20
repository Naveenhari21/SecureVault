const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN',
        'LOGOUT',
        'REGISTER',
        'FILE_UPLOAD',
        'FILE_DOWNLOAD',
        'FILE_UPDATE',
        'FILE_DELETE',
        'FILE_RESTORE',
        'FILE_SHARE',
        'PERMISSION_CHANGE',
        'PERMISSION_REVOKE',
        'VERSION_UPLOAD',
        'VERSION_DOWNLOAD',
        'PROFILE_UPDATE',
        'PASSWORD_CHANGE',
      ],
    },
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      default: null,
    },
    details: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Index for fast querying
AuditLogSchema.index({ user: 1, createdAt: -1 });
AuditLogSchema.index({ file: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
