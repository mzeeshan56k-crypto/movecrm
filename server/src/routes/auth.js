import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { one, tx } from '../db.js';
import { signToken, requireAuth } from '../auth.js';
import { provisionOrg } from '../provision.js';
import { newPublicKey } from '../schema.js';

const router = Router();

// The platform owner gets unlimited free access. The owner is whoever signs up
// first on a fresh install, or anyone whose email matches OWNER_EMAIL.
// Everyone else starts on a 14-day trial, then chooses a paid plan.
async function isOwnerEmail(client, cleanEmail) {
  const envOwner = (process.env.OWNER_EMAIL || '').toLowerCase().trim();
  if (envOwner && cleanEmail === envOwner) return true;
  const count = (await client.query('SELECT COUNT(*)::int AS n FROM organizations')).rows[0].n;
  return count === 0;
}

// Self-serve signup: creates a new organization + its first admin user.
// New companies start with a clean workspace (only their default config), so
// everything they see from here on is their own real data.
router.post('/signup', async (req, res) => {
  const { company_name, name, email, password } = req.body || {};
  if (!company_name || !name || !email || !password) {
    return res.status(400).json({ error: 'Company name, your name, email and password are all required' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const cleanEmail = String(email).toLowerCase().trim();
  const existing = await one('SELECT id FROM users WHERE email = $1', [cleanEmail]);
  if (existing) return res.status(409).json({ error: 'That email is already registered. Try logging in.' });

  try {
    const user = await tx(async (client) => {
      const owner = await isOwnerEmail(client, cleanEmail);
      const plan = owner ? 'owner' : 'trial';
      const key = newPublicKey();
      const org = (await client.query(
        `INSERT INTO organizations (name, public_key, plan, trial_ends_at)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [company_name, key, plan, owner ? null : new Date(Date.now() + 14 * 864e5).toISOString()]
      )).rows[0];
      await client.query('INSERT INTO websites (org_id, name, public_key) VALUES ($1, $2, $3)', [org.id, 'Main Website', key]);
      const u = (await client.query(
        'INSERT INTO users (org_id, name, email, password_hash, role) VALUES ($1,$2,$3,$4,$5) RETURNING id, org_id, name, email, role',
        [org.id, name, cleanEmail, bcrypt.hashSync(password, 10), 'admin']
      )).rows[0];
      await provisionOrg(client, org.id, company_name);
      return u;
    });
    res.status(201).json({ token: signToken(user), user });
  } catch (e) {
    console.error('Signup failed:', e);
    res.status(500).json({ error: 'Could not create account. Please try again.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const cleanEmail = String(email).toLowerCase().trim();
  const user = await one('SELECT * FROM users WHERE email = $1 AND active = 1', [cleanEmail]);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  // Keep the configured owner on the owner plan even if their plan drifted.
  const envOwner = (process.env.OWNER_EMAIL || '').toLowerCase().trim();
  if (envOwner && cleanEmail === envOwner) {
    await one("UPDATE organizations SET plan = 'owner' WHERE id = $1 AND plan <> 'owner' RETURNING id", [user.org_id]);
  }
  res.json({
    token: signToken(user),
    user: { id: user.id, org_id: user.org_id, name: user.name, email: user.email, role: user.role },
  });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await one('SELECT id, org_id, name, email, role FROM users WHERE id = $1', [req.user.id]);
  if (!user) return res.status(401).json({ error: 'User no longer exists' });
  const org = await one('SELECT name, plan, plan_renews_at, trial_ends_at FROM organizations WHERE id = $1', [user.org_id]);
  res.json({ user, organization: org });
});

export default router;
