const crypto = require('crypto');
const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(String(process.env.ENCRYPTION_KEY)).digest();

function encrypt(text) {
    if (!text) return null;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted}`;
}

function decrypt(text) {
    if (!text) return null;
    try {
        const [ivHex, tagHex, encryptedText] = text.split(':');
        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, Buffer.from(ivHex, 'hex'));
        decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
        return decipher.update(encryptedText, 'hex', 'utf8') + decipher.final('utf8');
    } catch { return null; }
}

module.exports = { encrypt, decrypt };