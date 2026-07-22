import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Never ship a publicly-known signing key. Prefer an explicit JWT_SECRET. If it
// is not set, derive a strong, stable secret from other server-only secrets
// (the database URL + owner email) so login tokens can't be forged with the
// value that lives in this repo. Only falls back to the dev key with no DB at all.
function resolveJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const seed = process.env.DATABASE_URL || '';
  if (seed) {
    return crypto.createHash('sha256')
      .update('moverscrm:' + seed + ':' + (process.env.OWNER_EMAIL || ''))
      .digest('hex');
  }
  if (process.env.NODE_ENV === 'production') {
    console.warn('[security] JWT_SECRET and DATABASE_URL are both unset — using an insecure dev key. Set JWT_SECRET.');
  }
  return 'movecrm-dev-secret-change-me';
}

export const JWT_SECRET = resolveJwtSecret();

export function signToken(user) {
  return jwt.sign(
    { id: user.id, org_id: user.org_id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    req.orgId = req.user.org_id;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
