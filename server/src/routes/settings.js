import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { q, one, run } from '../db.js';
import { requireRole } from '../auth.js';

const router = Router();

// --- Company settings (key/value, per org) ---
router.get('/company', async (req, res) => {
  const rows = await q('SELECT key, value FROM settings WHERE org_id = $1', [req.orgId]);
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
});

router.put('/company', requireRole('admin'), async (req, res) => {
  for (const [k, v] of Object.entries(req.body || {})) {
    await run(
      `INSERT INTO settings (org_id, key, value) VALUES ($1,$2,$3)
       ON CONFLICT (org_id, key) DO UPDATE SET value = EXCLUDED.value`,
      [req.orgId, k, String(v)]
    );
  }
  const rows = await q('SELECT key, value FROM settings WHERE org_id = $1', [req.orgId]);
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
});

// --- Generic small-table CRUD, scoped to org ---
function crud(pathName, table, columns) {
  router.get(`/${pathName}`, async (req, res) => {
    res.json(await q(`SELECT * FROM ${table} WHERE org_id = $1 ORDER BY id`, [req.orgId]));
  });
  router.post(`/${pathName}`, requireRole('admin'), async (req, res) => {
    if (!req.body?.name) return res.status(400).json({ error: 'Name is required' });
    const vals = columns.map((c) => req.body?.[c] ?? null);
    const cols = ['org_id', ...columns];
    const ph = cols.map((_, i) => `$${i + 1}`).join(',');
    try {
      const row = await one(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${ph}) RETURNING *`, [req.orgId, ...vals]);
      res.status(201).json(row);
    } catch (e) { res.status(400).json({ error: e.message }); }
  });
  router.put(`/${pathName}/:id`, requireRole('admin'), async (req, res) => {
    const existing = await one(`SELECT * FROM ${table} WHERE id = $1 AND org_id = $2`, [req.params.id, req.orgId]);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const u = { ...existing, ...req.body };
    const set = columns.map((c, i) => `${c}=$${i + 1}`).join(',');
    const row = await one(
      `UPDATE ${table} SET ${set} WHERE id=$${columns.length + 1} AND org_id=$${columns.length + 2} RETURNING *`,
      [...columns.map((c) => u[c]), req.params.id, req.orgId]
    );
    res.json(row);
  });
  router.delete(`/${pathName}/:id`, requireRole('admin'), async (req, res) => {
    try {
      await run(`DELETE FROM ${table} WHERE id = $1 AND org_id = $2`, [req.params.id, req.orgId]);
      res.json({ ok: true });
    } catch {
      res.status(400).json({ error: 'Cannot delete: still referenced by existing records' });
    }
  });
}

crud('lead-sources', 'lead_sources', ['name', 'active']);
crud('move-sizes', 'move_sizes', ['name', 'cubic_feet', 'est_hours', 'est_movers']);
crud('services', 'services', ['name', 'rate_type', 'rate', 'active']);
crud('email-templates', 'email_templates', ['name', 'subject', 'body']);

// --- Users (within the org) ---
router.get('/users', async (req, res) => {
  res.json(await q('SELECT id, name, email, role, active, created_at FROM users WHERE org_id = $1 ORDER BY name', [req.orgId]));
});

router.post('/users', requireRole('admin'), async (req, res) => {
  const { name, email, password, role = 'salesperson' } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
  try {
    const row = await one(
      'INSERT INTO users (org_id, name, email, password_hash, role) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, role, active',
      [req.orgId, name, String(email).toLowerCase().trim(), bcrypt.hashSync(password, 10), role]
    );
    res.status(201).json(row);
  } catch (e) {
    res.status(400).json({ error: /unique/i.test(e.message) ? 'Email already in use' : e.message });
  }
});

router.put('/users/:id', requireRole('admin'), async (req, res) => {
  const existing = await one('SELECT * FROM users WHERE id = $1 AND org_id = $2', [req.params.id, req.orgId]);
  if (!existing) return res.status(404).json({ error: 'User not found' });
  const u = { ...existing, ...req.body };
  const hash = req.body?.password ? bcrypt.hashSync(req.body.password, 10) : existing.password_hash;
  const row = await one(
    'UPDATE users SET name=$1, email=$2, password_hash=$3, role=$4, active=$5 WHERE id=$6 AND org_id=$7 RETURNING id, name, email, role, active',
    [u.name, String(u.email).toLowerCase().trim(), hash, u.role, u.active ? 1 : 0, req.params.id, req.orgId]
  );
  res.json(row);
});

// --- Tasks ---
router.get('/tasks', async (req, res) => {
  res.json(await q(`
    SELECT t.*, u.name AS assignee, j.job_number FROM tasks t
    LEFT JOIN users u ON u.id = t.assigned_to LEFT JOIN jobs j ON j.id = t.job_id
    WHERE t.org_id = $1 ORDER BY t.completed, t.due_date NULLS LAST LIMIT 500`, [req.orgId]));
});

router.post('/tasks', async (req, res) => {
  const { title, job_id = null, assigned_to = null, due_date = null } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const row = await one('INSERT INTO tasks (org_id, title, job_id, assigned_to, due_date) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [req.orgId, title, job_id, assigned_to || req.user.id, due_date]);
  res.status(201).json(row);
});

router.put('/tasks/:id', async (req, res) => {
  const existing = await one('SELECT * FROM tasks WHERE id = $1 AND org_id = $2', [req.params.id, req.orgId]);
  if (!existing) return res.status(404).json({ error: 'Task not found' });
  const u = { ...existing, ...req.body };
  const row = await one('UPDATE tasks SET title=$1, job_id=$2, assigned_to=$3, due_date=$4, completed=$5 WHERE id=$6 AND org_id=$7 RETURNING *',
    [u.title, u.job_id, u.assigned_to, u.due_date, u.completed ? 1 : 0, req.params.id, req.orgId]);
  res.json(row);
});

router.delete('/tasks/:id', async (req, res) => {
  await run('DELETE FROM tasks WHERE id = $1 AND org_id = $2', [req.params.id, req.orgId]);
  res.json({ ok: true });
});

export default router;
