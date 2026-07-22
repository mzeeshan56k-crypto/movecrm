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

// Creates a fresh organization + its first admin user, provisions default config.
// Shared by self-serve signup and the one-time owner setup.
async function createOrgWithUser(client, { company_name, name, email, password, owner }) {
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
    [org.id, name, email, bcrypt.hashSync(password, 10), 'admin']
  )).rows[0];
  await provisionOrg(client, org.id, company_name);
  return u;
}

const ownerEmail = () => (process.env.OWNER_EMAIL || '').toLowerCase().trim();

// The platform owner never has to fill in a signup form. Instead they claim
// their pre-designated OWNER_EMAIL by setting a password once, then log in.
// This endpoint tells the UI whether owner setup applies and if it's still open.
router.get('/owner', async (req, res) => {
  const email = ownerEmail();
  const passwordConfigured = !!(process.env.OWNER_PASSWORD || '').trim();
  if (!email) return res.json({ configured: false, passwordConfigured });
  const existing = await one('SELECT id, active FROM users WHERE email = $1', [email]);
  res.json({
    configured: true,
    passwordConfigured,
    claimed: !!existing,
    active: existing ? existing.active : null,
    email,
  });
});

// One-time owner activation: set the password for OWNER_EMAIL and get logged in.
// Once claimed, this is closed — the owner just signs in from then on.
router.post('/owner/setup', async (req, res) => {
  const email = ownerEmail();
  if (!email) return res.status(400).json({ error: 'Owner access is not configured on this server.' });
  const { password } = req.body || {};
  if (!password || String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const existing = await one('SELECT id FROM users WHERE email = $1', [email]);
  if (existing) {
    return res.status(409).json({ error: 'Owner account is already set up. Please sign in with your password.' });
  }
  try {
    const user = await tx((client) => createOrgWithUser(client, {
      company_name: process.env.OWNER_COMPANY || 'Move CRM',
      name: process.env.OWNER_NAME || 'Owner',
      email,
      password,
      owner: true,
    }));
    res.status(201).json({ token: signToken(user), user });
  } catch (e) {
    console.error('Owner setup failed:', e);
    res.status(500).json({ error: 'Could not set up owner account. Please try again.' });
  }
});

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
      return createOrgWithUser(client, { company_name, name, email: cleanEmail, password, owner });
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
  const envOwner = ownerEmail();
  const isOwner = envOwner && cleanEmail === envOwner;
  const ownerPass = (process.env.OWNER_PASSWORD || '').trim();

  const user = await one('SELECT * FROM users WHERE email = $1 AND active = 1', [cleanEmail]);

  // The platform owner never signs up. Two ways their login "just works":
  if (isOwner) {
    // 1) If OWNER_PASSWORD is configured, that env value is the single source of
    //    truth. The owner signs in with it from ANY state — even if a stale user
    //    row exists with a forgotten password — and the account is created or
    //    re-synced to match. This guarantees the owner can always get in.
    if (ownerPass) {
      if (password !== ownerPass) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      try {
        const owned = await tx(async (client) => {
          const existing = (await client.query('SELECT id, org_id FROM users WHERE email = $1', [cleanEmail])).rows[0];
          if (!existing) {
            return createOrgWithUser(client, {
              company_name: process.env.OWNER_COMPANY || 'Move CRM',
              name: process.env.OWNER_NAME || 'Owner',
              email: cleanEmail, password: ownerPass, owner: true,
            });
          }
          const u = (await client.query(
            'UPDATE users SET password_hash = $1, active = 1 WHERE id = $2 RETURNING id, org_id, name, email, role',
            [bcrypt.hashSync(ownerPass, 10), existing.id]
          )).rows[0];
          await client.query("UPDATE organizations SET plan = 'owner' WHERE id = $1", [existing.org_id]);
          return u;
        });
        return res.json({ token: signToken(owned), user: owned });
      } catch (e) {
        console.error('Owner login (env password) failed:', e);
        return res.status(500).json({ error: 'Could not sign in owner. Please try again.' });
      }
    }

    // 2) No OWNER_PASSWORD set: the first login sets the password and provisions
    //    the owner workspace on the spot; later logins verify against it.
    if (!user) {
      if (String(password).length < 6) {
        return res.status(400).json({ error: 'Set an owner password of at least 6 characters on first login.' });
      }
      try {
        const created = await tx((client) => createOrgWithUser(client, {
          company_name: process.env.OWNER_COMPANY || 'Move CRM',
          name: process.env.OWNER_NAME || 'Owner',
          email: cleanEmail, password, owner: true,
        }));
        return res.status(201).json({ token: signToken(created), user: created });
      } catch (e) {
        console.error('Owner first-login setup failed:', e);
        return res.status(500).json({ error: 'Could not set up owner account. Please try again.' });
      }
    }
  }

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  // Keep the configured owner on the owner plan even if their plan drifted.
  if (isOwner) {
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
