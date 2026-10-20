const mongoose = require('mongoose');

const PermissionSchema = new mongoose.Schema(
  {
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    permission: {
      type: String,
      enum: ['owner', 'edit', 'view', 'none'],
      required: true,
    },
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Compound unique index — one permission record per user per file
PermissionSchema.index({ file: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Permission', PermissionSchema);
