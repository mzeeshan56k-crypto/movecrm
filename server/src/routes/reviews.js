import { Router } from 'express';
import crypto from 'crypto';
import { q, one, run } from '../db.js';

const router = Router();

const token = () => crypto.randomBytes(16).toString('hex');

// List review requests + summary stats.
router.get('/', async (req, res) => {
  const rows = await q(`
    SELECT r.*, c.first_name, c.last_name, j.job_number
    FROM review_requests r
    LEFT JOIN customers c ON c.id = r.customer_id
    LEFT JOIN jobs j ON j.id = r.job_id
    WHERE r.org_id = $1 ORDER BY r.created_at DESC LIMIT 500
  `, [req.orgId]);
  const stats = await one(`
    SELECT COUNT(*)::int AS requested,
      SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END)::int AS reviewed,
      ROUND(AVG(rating)::numeric, 2) AS avg_rating,
      SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END)::int AS positive
    FROM review_requests WHERE org_id = $1
  `, [req.orgId]);
  res.json({ requests: rows, stats });
});

// Create a review request for a job/customer. Returns the shareable link.
router.post('/', async (req, res) => {
  const { job_id = null, customer_id = null, channel = 'link' } = req.body || {};
  let custId = customer_id;
  if (!custId && job_id) {
    const job = await one('SELECT customer_id FROM jobs WHERE id = $1 AND org_id = $2', [job_id, req.orgId]);
    custId = job?.customer_id || null;
  }
  if (!custId) return res.status(400).json({ error: 'A customer or job is required' });
  const row = await one(
    `INSERT INTO review_requests (org_id, job_id, customer_id, token, channel, status, sent_at)
     VALUES ($1,$2,$3,$4,$5,'sent', now()) RETURNING *`,
    [req.orgId, job_id, custId, token(), channel]
  );
  res.status(201).json(row);
});

router.delete('/:id', async (req, res) => {
  await run('DELETE FROM review_requests WHERE id = $1 AND org_id = $2', [req.params.id, req.orgId]);
  res.json({ ok: true });
});

// Review settings (Google link, message, auto-request toggle) live in settings.
router.get('/settings', async (req, res) => {
  const rows = await q("SELECT key, value FROM settings WHERE org_id = $1 AND key LIKE 'review_%'", [req.orgId]);
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
});

router.put('/settings', async (req, res) => {
  const allowed = ['review_google_url', 'review_message', 'review_auto_on_complete'];
  for (const [k, v] of Object.entries(req.body || {})) {
    if (!allowed.includes(k)) continue;
    await run(
      `INSERT INTO settings (org_id, key, value) VALUES ($1,$2,$3)
       ON CONFLICT (org_id, key) DO UPDATE SET value = EXCLUDED.value`,
      [req.orgId, k, String(v)]
    );
  }
  const rows = await q("SELECT key, value FROM settings WHERE org_id = $1 AND key LIKE 'review_%'", [req.orgId]);
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
});

export default router;
