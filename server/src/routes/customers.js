import { Router } from 'express';
import { q, one, run } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const search = (req.query.q || '').trim();
  const params = [req.orgId];
  let where = 'WHERE c.org_id = $1';
  if (search) {
    params.push(`%${search}%`);
    where += ` AND (c.first_name || ' ' || c.last_name ILIKE $2 OR c.email ILIKE $2 OR c.phone ILIKE $2)`;
  }
  const rows = await q(`
    SELECT c.*, COUNT(j.id) AS job_count,
      COALESCE(SUM(CASE WHEN j.status IN ('booked','in_progress','completed') THEN j.estimated_total ELSE 0 END), 0) AS lifetime_value
    FROM customers c LEFT JOIN jobs j ON j.customer_id = c.id
    ${where}
    GROUP BY c.id ORDER BY c.created_at DESC LIMIT 500
  `, params);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const customer = await one('SELECT * FROM customers WHERE id = $1 AND org_id = $2', [req.params.id, req.orgId]);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  const jobs = await q(`
    SELECT j.*, ms.name AS move_size FROM jobs j
    LEFT JOIN move_sizes ms ON ms.id = j.move_size_id
    WHERE j.customer_id = $1 ORDER BY j.created_at DESC
  `, [req.params.id]);
  const activities = await q(`
    SELECT a.*, u.name AS user_name FROM activities a
    LEFT JOIN users u ON u.id = a.user_id
    WHERE a.customer_id = $1 OR a.job_id IN (SELECT id FROM jobs WHERE customer_id = $1)
    ORDER BY a.created_at DESC LIMIT 100
  `, [req.params.id]);
  res.json({ ...customer, jobs, activities });
});

router.post('/', async (req, res) => {
  const { first_name, last_name = '', email = null, phone = null, company = null, address = null, notes = null } = req.body || {};
  if (!first_name) return res.status(400).json({ error: 'First name is required' });
  const row = await one(
    'INSERT INTO customers (org_id, first_name, last_name, email, phone, company, address, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
    [req.orgId, first_name, last_name, email, phone, company, address, notes]
  );
  res.status(201).json(row);
});

router.put('/:id', async (req, res) => {
  const existing = await one('SELECT * FROM customers WHERE id = $1 AND org_id = $2', [req.params.id, req.orgId]);
  if (!existing) return res.status(404).json({ error: 'Customer not found' });
  const u = { ...existing, ...pick(req.body, ['first_name', 'last_name', 'email', 'phone', 'company', 'address', 'notes']) };
  const row = await one(
    'UPDATE customers SET first_name=$1, last_name=$2, email=$3, phone=$4, company=$5, address=$6, notes=$7 WHERE id=$8 AND org_id=$9 RETURNING *',
    [u.first_name, u.last_name, u.email, u.phone, u.company, u.address, u.notes, req.params.id, req.orgId]
  );
  res.json(row);
});

router.delete('/:id', async (req, res) => {
  await run('DELETE FROM customers WHERE id = $1 AND org_id = $2', [req.params.id, req.orgId]);
  res.json({ ok: true });
});

function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj && k in obj) out[k] = obj[k];
  return out;
}

export default router;
