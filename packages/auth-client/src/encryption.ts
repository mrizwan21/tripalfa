const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default_key_that_is_32_bytes_long', 'utf8');

function getIv(): Buffer {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const arr = new Uint8Array(16);
    window.crypto.getRandomValues(arr);
    return Buffer.from(arr);
  }
  const nodeRandomBytes = (require('crypto') as typeof import('crypto')).randomBytes;
  return nodeRandomBytes(16);
}

export function encryptData(data: string): string {
  const iv = getIv();
  const { createCipheriv } = require('crypto') as typeof import('crypto');
  const cipher = createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decryptData(encryptedData: string): string {
  const [ivHex, encrypted] = encryptedData.split(':');
  const { createDecipheriv } = require('crypto') as typeof import('crypto');
  const decipher = createDecipheriv(algorithm, key, Buffer.from(ivHex, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}