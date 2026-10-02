import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const TOKEN_RE = /^Bearer ([A-Za-z0-9_-]{43})$/;

const sessions = new Map(); // token -> expiresAt
const attempts = new Map(); // ip -> { count, resetAt }

const digest = (value) => createHash('sha256').update(value).digest();

const adminEmail = () => (process.env.ADMIN_EMAIL || '').trim().toLowerCase();

export function adminEnabled() {
  return adminEmail().includes('@') && (process.env.ADMIN_PASSWORD || '').length >= 12;
}

const sameSecret = (given, expected) =>
  typeof given === 'string' && given.length <= 254 && timingSafeEqual(digest(given), digest(expected));

function prune(now) {
  for (const [token, exp] of sessions) if (exp <= now) sessions.delete(token);
  for (const [ip, a] of attempts) if (a.resetAt <= now) attempts.delete(ip);
}

export function login(ip, email, password) {
  const now = Date.now();
  prune(now);
  const record = attempts.get(ip);
  if (record && record.count >= MAX_ATTEMPTS) return { status: 429 };
  // Compara hashes de igual longitud en tiempo constante; ambas comprobaciones siempre se ejecutan.
  const emailOk = sameSecret(typeof email === 'string' ? email.trim().toLowerCase() : email, adminEmail());
  const passwordOk = sameSecret(password, process.env.ADMIN_PASSWORD);
  const ok = emailOk && passwordOk;
  if (!ok) {
    const next = record ?? { count: 0, resetAt: now + ATTEMPT_WINDOW_MS };
    next.count += 1;
    attempts.set(ip, next);
    return { status: 401 };
  }
  attempts.delete(ip);
  const token = randomBytes(32).toString('base64url');
  sessions.set(token, now + SESSION_TTL_MS);
  return { status: 200, token };
}

export function logout(token) {
  sessions.delete(token);
}

export function requireAdmin(req, res, next) {
  if (!adminEnabled()) return res.status(503).json({ ok: false, error: 'admin_disabled' });
  const match = TOKEN_RE.exec(req.get('authorization') || '');
  const expiresAt = match && sessions.get(match[1]);
  if (!expiresAt || expiresAt <= Date.now()) {
    if (match) sessions.delete(match[1]);
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }
  req.adminToken = match[1];
  next();
}
