const mongoose = require('mongoose');

const FileVersionSchema = new mongoose.Schema(
  {
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      required: true,
    },
    versionNumber: {
      type: Number,
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
    storedName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    comment: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FileVersion', FileVersionSchema);
