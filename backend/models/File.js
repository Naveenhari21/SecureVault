const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
    },
    storedName: {
      type: String,
      required: true,
    },
    // encryptedPath kept for backward-compat but not used in cloud mode
    encryptedPath: {
      type: String,
      default: '',
    },
    // encrypted file bytes stored directly in MongoDB
    encryptedData: {
      type: Buffer,
      default: null,
    },
    iv: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    currentVersion: {
      type: Number,
      default: 1,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Soft-delete filter
FileSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

module.exports = mongoose.model('File', FileSchema);
