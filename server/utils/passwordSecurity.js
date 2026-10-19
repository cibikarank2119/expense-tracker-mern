const crypto = require('crypto');
const { promisify } = require('util');

const pbkdf2 = promisify(crypto.pbkdf2);

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

// Layer 1: strength check
function checkStrength(password) {
  const problems = [];
  if (typeof password !== 'string' || password.length < 8) problems.push('at least 8 characters');
  if (!/[A-Z]/.test(password)) problems.push('one uppercase letter');
  if (!/[a-z]/.test(password)) problems.push('one lowercase letter');
  if (!/[0-9]/.test(password)) problems.push('one number');
  return problems;
}

// Layers 2-4: pepper + salt + key stretching
async function derive(password, salt) {
  const pepper = process.env.PEPPER;
  if (!pepper) throw new Error('PEPPER is missing in .env');
  const peppered = crypto.createHmac('sha256', pepper).update(password).digest('hex');
  const key = await pbkdf2(peppered, salt, ITERATIONS, KEY_LENGTH, DIGEST);
  return key.toString('hex');
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await derive(password, salt);
  return { salt, hash };
}

async function verifyPassword(password, salt, storedHash) {
  const hash = await derive(password, salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { checkStrength, hashPassword, verifyPassword };
