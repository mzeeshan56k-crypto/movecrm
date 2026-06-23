import { Router } from 'express';
import { q, one, run } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const rows = await q(`
    SELECT cl.*, c.first_name, c.last_name, j.job_number
    FROM calls cl
    LEFT JOIN customers c ON c.id = cl.customer_id
    LEFT JOIN jobs j ON j.id = cl.job_id
    WHERE cl.org_id = $1
    ORDER BY cl.created_at DESC LIMIT 500
  `, [req.orgId]);
  res.json(rows);
});

// Manually log a call (e.g. made from a personal phone), optionally with a
// link to a recording stored elsewhere.
router.post('/', async (req, res) => {
  const { direction = 'outbound', from_number = null, to_number = null, customer_id = null, job_id = null, notes = null, recording_url = null, duration_seconds = null } = req.body || {};
  const row = await one(
    `INSERT INTO calls (org_id, direction, from_number, to_number, status, customer_id, job_id, notes, recording_url, duration_seconds)
     VALUES ($1,$2,$3,$4,'logged',$5,$6,$7,$8,$9) RETURNING *`,
    [req.orgId, direction, from_number, to_number, customer_id, job_id, notes, recording_url, duration_seconds]
  );
  res.status(201).json(row);
});

router.put('/:id', async (req, res) => {
  const existing = await one('SELECT * FROM calls WHERE id = $1 AND org_id = $2', [req.params.id, req.orgId]);
  if (!existing) return res.status(404).json({ error: 'Call not found' });
  const u = { ...existing, ...req.body };
  const row = await one(
    'UPDATE calls SET notes=$1, customer_id=$2, job_id=$3 WHERE id=$4 AND org_id=$5 RETURNING *',
    [u.notes, u.customer_id, u.job_id, req.params.id, req.orgId]
  );
  res.json(row);
});

router.delete('/:id', async (req, res) => {
  await run('DELETE FROM calls WHERE id = $1 AND org_id = $2', [req.params.id, req.orgId]);
  res.json({ ok: true });
});

export default router;
