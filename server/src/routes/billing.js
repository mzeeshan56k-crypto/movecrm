import { Router } from 'express';
import { q, one, run, nextNumber, logActivity } from '../db.js';

const router = Router();

async function invoiceWithBalance(orgId, id) {
  const inv = await one(`
    SELECT i.*, j.job_number, c.first_name, c.last_name,
      COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id = i.id), 0) AS paid
    FROM invoices i JOIN jobs j ON j.id = i.job_id JOIN customers c ON c.id = j.customer_id
    WHERE i.id = $1 AND i.org_id = $2
  `, [id, orgId]);
  if (inv) {
    inv.balance = Math.round((inv.total - inv.paid) * 100) / 100;
    inv.payments = await q('SELECT * FROM payments WHERE invoice_id = $1 ORDER BY paid_at DESC', [id]);
  }
  return inv;
}

async function refreshStatus(invoiceId) {
  const inv = await one(`
    SELECT total, status, COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id = invoices.id), 0) AS paid
    FROM invoices WHERE id = $1
  `, [invoiceId]);
  if (!inv || inv.status === 'void') return;
  let status = inv.status;
  if (inv.paid >= inv.total && inv.total > 0) status = 'paid';
  else if (inv.paid > 0) status = 'partial';
  await run('UPDATE invoices SET status = $1 WHERE id = $2', [status, invoiceId]);
}

router.get('/invoices', async (req, res) => {
  const { status } = req.query;
  const params = [req.orgId];
  let where = 'WHERE i.org_id = $1';
  if (status) { params.push(status); where += ' AND i.status = $2'; }
  const rows = await q(`
    SELECT i.*, j.job_number, c.first_name, c.last_name,
      COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id = i.id), 0) AS paid
    FROM invoices i JOIN jobs j ON j.id = i.job_id JOIN customers c ON c.id = j.customer_id
    ${where} ORDER BY i.created_at DESC LIMIT 500
  `, params);
  for (const r of rows) r.balance = Math.round((r.total - r.paid) * 100) / 100;
  res.json(rows);
});

router.get('/invoices/:id', async (req, res) => {
  const inv = await invoiceWithBalance(req.orgId, req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  res.json(inv);
});

router.post('/invoices', async (req, res) => {
  const { job_id, tax_rate = 0, discount = 0, due_date = null } = req.body || {};
  const job = await one('SELECT * FROM jobs WHERE id = $1 AND org_id = $2', [job_id, req.orgId]);
  if (!job) return res.status(400).json({ error: 'Valid job_id required' });
  const subtotal = job.estimated_total || 0;
  const total = Math.round((subtotal - discount) * (1 + tax_rate / 100) * 100) / 100;
  const num = await nextNumber(req.orgId, 'INV', 'invoice');
  const inv = await one(
    'INSERT INTO invoices (org_id, invoice_number, job_id, status, subtotal, tax_rate, discount, total, due_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id',
    [req.orgId, num, job_id, 'sent', subtotal, tax_rate, discount, total, due_date]
  );
  await logActivity({ org_id: req.orgId, job_id, user_id: req.user.id, type: 'system', subject: `Invoice ${num} created ($${total.toFixed(2)})` });
  res.status(201).json(await invoiceWithBalance(req.orgId, inv.id));
});

router.put('/invoices/:id', async (req, res) => {
  const existing = await one('SELECT * FROM invoices WHERE id = $1 AND org_id = $2', [req.params.id, req.orgId]);
  if (!existing) return res.status(404).json({ error: 'Invoice not found' });
  const u = { ...existing, ...req.body };
  const total = Math.round((u.subtotal - u.discount) * (1 + u.tax_rate / 100) * 100) / 100;
  await run('UPDATE invoices SET status=$1, subtotal=$2, tax_rate=$3, discount=$4, total=$5, due_date=$6 WHERE id=$7 AND org_id=$8',
    [u.status, u.subtotal, u.tax_rate, u.discount, total, u.due_date, req.params.id, req.orgId]);
  await refreshStatus(req.params.id);
  res.json(await invoiceWithBalance(req.orgId, req.params.id));
});

router.post('/invoices/:id/payments', async (req, res) => {
  const inv = await one('SELECT * FROM invoices WHERE id = $1 AND org_id = $2', [req.params.id, req.orgId]);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  const { amount, method = 'card', reference = null, paid_at } = req.body || {};
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Payment amount must be positive' });
  await run('INSERT INTO payments (org_id, invoice_id, amount, method, reference, paid_at) VALUES ($1,$2,$3,$4,$5,$6)',
    [req.orgId, inv.id, amount, method, reference, paid_at || new Date().toISOString()]);
  await refreshStatus(inv.id);
  await logActivity({ org_id: req.orgId, job_id: inv.job_id, user_id: req.user.id, type: 'system', subject: `Payment recorded: $${Number(amount).toFixed(2)} (${method})` });
  res.status(201).json(await invoiceWithBalance(req.orgId, inv.id));
});

router.delete('/payments/:id', async (req, res) => {
  const p = await one('SELECT * FROM payments WHERE id = $1 AND org_id = $2', [req.params.id, req.orgId]);
  if (!p) return res.status(404).json({ error: 'Payment not found' });
  await run('DELETE FROM payments WHERE id = $1', [p.id]);
  await run("UPDATE invoices SET status = 'sent' WHERE id = $1 AND status IN ('paid','partial')", [p.invoice_id]);
  await refreshStatus(p.invoice_id);
  res.json({ ok: true });
});

export default router;
