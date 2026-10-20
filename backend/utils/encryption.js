const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';

/**
 * Get the 32-byte encryption key from env.
 * Pads or truncates to exactly 32 bytes.
 */
const getKey = () => {
  const key = process.env.ENCRYPTION_KEY || '';
  return Buffer.from(key.padEnd(32, '0').slice(0, 32));
};

/**
 * Encrypt a Buffer of file data.
 * Returns { encryptedBuffer, iv (hex string) }
 */
const encryptFile = (fileBuffer) => {
  const iv = crypto.randomBytes(16);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
  return { encryptedBuffer: encrypted, iv: iv.toString('hex') };
};

/**
 * Decrypt an encrypted Buffer using the stored IV (hex string).
 * Returns the decrypted Buffer.
 */
const decryptFile = (encryptedBuffer, ivHex) => {
  const iv = Buffer.from(ivHex, 'hex');
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  return decrypted;
};

module.exports = { encryptFile, decryptFile };
