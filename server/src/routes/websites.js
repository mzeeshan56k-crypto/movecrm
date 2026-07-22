import { Router } from 'express';
import { q, one, run } from '../db.js';
import { requireRole } from '../auth.js';
import { newPublicKey } from '../schema.js';
import { assertWithinLimit, orgPlan } from '../limits.js';

const router = Router();

router.get('/', async (req, res) => {
  const rows = await q(`
    SELECT w.*, (SELECT COUNT(*)::int FROM jobs j WHERE j.org_id = w.org_id) AS org_jobs
    FROM websites w WHERE w.org_id = $1 ORDER BY w.id
  `, [req.orgId]);
  res.json(rows);
});

router.post('/', requireRole('admin'), async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Website name is required' });
  // Lead-capture websites are a paid product. Self-serve/trial accounts cannot
  // provision them — they must purchase a plan from us first.
  const plan = await orgPlan(req.orgId);
  if (plan.trial) {
    return res.status(402).json({
      error: 'Lead-capture websites are sold separately. Choose a plan or contact us to add a website.',
      upgrade: true,
    });
  }
  try {
    await assertWithinLimit(req.orgId, 'websites');
  } catch (e) {
    return res.status(e.status || 400).json({ error: e.message, upgrade: e.upgrade });
  }
  const row = await one(
    'INSERT INTO websites (org_id, name, public_key) VALUES ($1, $2, $3) RETURNING *',
    [req.orgId, name, newPublicKey()]
  );
  res.status(201).json(row);
});

router.put('/:id', requireRole('admin'), async (req, res) => {
  const existing = await one('SELECT * FROM websites WHERE id = $1 AND org_id = $2', [req.params.id, req.orgId]);
  if (!existing) return res.status(404).json({ error: 'Website not found' });
  const u = { ...existing, ...req.body };
  const row = await one('UPDATE websites SET name = $1, active = $2 WHERE id = $3 AND org_id = $4 RETURNING *',
    [u.name, u.active ? 1 : 0, req.params.id, req.orgId]);
  res.json(row);
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  const count = (await one('SELECT COUNT(*)::int AS n FROM websites WHERE org_id = $1', [req.orgId])).n;
  if (count <= 1) return res.status(400).json({ error: 'You must keep at least one website.' });
  await run('DELETE FROM websites WHERE id = $1 AND org_id = $2', [req.params.id, req.orgId]);
  res.json({ ok: true });
});

export default router;
