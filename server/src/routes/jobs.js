import { Router } from 'express';
import crypto from 'crypto';
import { q, one, run, tx, nextNumber, logActivity } from '../db.js';

const router = Router();

const JOB_FIELDS = [
  'customer_id','status','type','move_date','arrival_window','move_size_id',
  'origin_address','origin_city','origin_state','origin_zip','origin_floor',
  'dest_address','dest_city','dest_state','dest_zip','dest_floor',
  'distance_miles','lead_source_id','salesperson_id','estimated_total','crew_notes','notes','lost_reason',
];

const STATUS_LABELS = {
  lead: 'Lead', opportunity: 'Opportunity', booked: 'Booked', in_progress: 'In Progress',
  completed: 'Completed', lost: 'Lost', cancelled: 'Cancelled',
};

async function fullJob(orgId, id) {
  const job = await one(`
    SELECT j.*, c.first_name, c.last_name, c.email AS customer_email, c.phone AS customer_phone,
      ms.name AS move_size, ls.name AS lead_source, u.name AS salesperson
    FROM jobs j
    JOIN customers c ON c.id = j.customer_id
    LEFT JOIN move_sizes ms ON ms.id = j.move_size_id
    LEFT JOIN lead_sources ls ON ls.id = j.lead_source_id
    LEFT JOIN users u ON u.id = j.salesperson_id
    WHERE j.id = $1 AND j.org_id = $2
  `, [id, orgId]);
  if (!job) return null;
  job.estimate_items = await q('SELECT * FROM estimate_items WHERE job_id = $1 ORDER BY id', [id]);
  job.inventory_items = await q('SELECT * FROM inventory_items WHERE job_id = $1 ORDER BY id', [id]);
  job.crew = await q('SELECT cm.* FROM crew_members cm JOIN job_crew jc ON jc.crew_member_id = cm.id WHERE jc.job_id = $1', [id]);
  job.trucks = await q('SELECT t.* FROM trucks t JOIN job_trucks jt ON jt.truck_id = t.id WHERE jt.job_id = $1', [id]);
  job.invoices = await q('SELECT * FROM invoices WHERE job_id = $1 ORDER BY created_at DESC', [id]);
  job.payments = await q('SELECT p.* FROM payments p JOIN invoices i ON i.id = p.invoice_id WHERE i.job_id = $1 ORDER BY p.paid_at DESC', [id]);
  job.activities = await q('SELECT a.*, u.name AS user_name FROM activities a LEFT JOIN users u ON u.id = a.user_id WHERE a.job_id = $1 ORDER BY a.created_at DESC LIMIT 200', [id]);
  job.tasks = await q('SELECT t.*, u.name AS assignee FROM tasks t LEFT JOIN users u ON u.id = t.assigned_to WHERE t.job_id = $1 ORDER BY t.completed, t.due_date', [id]);
  return job;
}

router.get('/', async (req, res) => {
  const { status, q: search, from, to, salesperson_id } = req.query;
  const clauses = ['j.org_id = $1'];
  const params = [req.orgId];
  if (status) {
    const list = status.split(',');
    clauses.push(`j.status IN (${list.map((_, i) => `$${params.length + i + 1}`).join(',')})`);
    params.push(...list);
  }
  if (from) { params.push(from); clauses.push(`j.move_date >= $${params.length}`); }
  if (to) { params.push(to); clauses.push(`j.move_date <= $${params.length}`); }
  if (salesperson_id) { params.push(salesperson_id); clauses.push(`j.salesperson_id = $${params.length}`); }
  if (search) {
    params.push(`%${search}%`);
    const p = `$${params.length}`;
    clauses.push(`(j.job_number ILIKE ${p} OR c.first_name || ' ' || c.last_name ILIKE ${p} OR c.email ILIKE ${p} OR c.phone ILIKE ${p})`);
  }
  const rows = await q(`
    SELECT j.*, c.first_name, c.last_name, c.phone AS customer_phone, c.email AS customer_email,
      ms.name AS move_size, ls.name AS lead_source, u.name AS salesperson
    FROM jobs j
    JOIN customers c ON c.id = j.customer_id
    LEFT JOIN move_sizes ms ON ms.id = j.move_size_id
    LEFT JOIN lead_sources ls ON ls.id = j.lead_source_id
    LEFT JOIN users u ON u.id = j.salesperson_id
    WHERE ${clauses.join(' AND ')}
    ORDER BY j.created_at DESC LIMIT 1000
  `, params);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const job = await fullJob(req.orgId, req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

router.post('/', async (req, res) => {
  const b = req.body || {};
  try {
    const jobId = await tx(async (client) => {
      let customerId = b.customer_id;
      if (!customerId && b.customer) {
        const c = b.customer;
        if (!c.first_name) throw new Error('Customer first name is required');
        customerId = (await client.query(
          'INSERT INTO customers (org_id, first_name, last_name, email, phone) VALUES ($1,$2,$3,$4,$5) RETURNING id',
          [req.orgId, c.first_name, c.last_name || '', c.email || null, c.phone || null]
        )).rows[0].id;
      }
      if (!customerId) throw new Error('customer_id or customer object required');

      const jobNumber = await nextNumber(req.orgId, 'JOB', 'job', client);
      const id = (await client.query(`
        INSERT INTO jobs (org_id, job_number, customer_id, status, type, move_date, arrival_window, move_size_id,
          origin_address, origin_city, origin_state, origin_zip, origin_floor,
          dest_address, dest_city, dest_state, dest_zip, dest_floor,
          distance_miles, lead_source_id, salesperson_id, estimated_total, notes)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23) RETURNING id`,
        [req.orgId, jobNumber, customerId, b.status || 'lead', b.type || 'local', b.move_date || null, b.arrival_window || null,
         b.move_size_id || null,
         b.origin_address || null, b.origin_city || null, b.origin_state || null, b.origin_zip || null, b.origin_floor || null,
         b.dest_address || null, b.dest_city || null, b.dest_state || null, b.dest_zip || null, b.dest_floor || null,
         b.distance_miles || null, b.lead_source_id || null, b.salesperson_id || req.user.id, b.estimated_total || 0, b.notes || null]
      )).rows[0].id;
      await client.query(
        'INSERT INTO activities (org_id, job_id, user_id, type, subject) VALUES ($1,$2,$3,$4,$5)',
        [req.orgId, id, req.user.id, 'system', 'Lead created']
      );
      return id;
    });
    res.status(201).json(await fullJob(req.orgId, jobId));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  const existing = await one('SELECT * FROM jobs WHERE id = $1 AND org_id = $2', [req.params.id, req.orgId]);
  if (!existing) return res.status(404).json({ error: 'Job not found' });
  const b = req.body || {};
  const u = { ...existing };
  for (const f of JOB_FIELDS) if (f in b) u[f] = b[f];

  if (b.status && b.status !== existing.status) {
    if (b.status === 'booked' && !existing.booked_at) u.booked_at = new Date().toISOString();
    if (b.status === 'completed' && !existing.completed_at) u.completed_at = new Date().toISOString();
    await logActivity({
      org_id: req.orgId, job_id: existing.id, user_id: req.user.id, type: 'status_change',
      subject: `Status changed: ${STATUS_LABELS[existing.status]} → ${STATUS_LABELS[b.status]}`,
      body: b.status === 'lost' && b.lost_reason ? `Reason: ${b.lost_reason}` : '',
    });
    // Automatically request a review when a move is completed (if enabled).
    if (b.status === 'completed') {
      const auto = await one("SELECT value FROM settings WHERE org_id = $1 AND key = 'review_auto_on_complete'", [req.orgId]);
      const already = await one('SELECT id FROM review_requests WHERE job_id = $1', [existing.id]);
      if (auto?.value === 'true' && !already) {
        await run(
          `INSERT INTO review_requests (org_id, job_id, customer_id, token, channel, status, sent_at)
           VALUES ($1,$2,$3,$4,'auto','sent', now())`,
          [req.orgId, existing.id, existing.customer_id, crypto.randomBytes(16).toString('hex')]
        );
        await logActivity({ org_id: req.orgId, job_id: existing.id, user_id: req.user.id, type: 'system', subject: 'Review request created' });
      }
    }
  }

  await run(`
    UPDATE jobs SET customer_id=$1, status=$2, type=$3, move_date=$4, arrival_window=$5, move_size_id=$6,
      origin_address=$7, origin_city=$8, origin_state=$9, origin_zip=$10, origin_floor=$11,
      dest_address=$12, dest_city=$13, dest_state=$14, dest_zip=$15, dest_floor=$16,
      distance_miles=$17, lead_source_id=$18, salesperson_id=$19, estimated_total=$20, crew_notes=$21, notes=$22, lost_reason=$23,
      booked_at=$24, completed_at=$25
    WHERE id=$26 AND org_id=$27`,
    [u.customer_id, u.status, u.type, u.move_date, u.arrival_window, u.move_size_id,
     u.origin_address, u.origin_city, u.origin_state, u.origin_zip, u.origin_floor,
     u.dest_address, u.dest_city, u.dest_state, u.dest_zip, u.dest_floor,
     u.distance_miles, u.lead_source_id, u.salesperson_id, u.estimated_total, u.crew_notes, u.notes, u.lost_reason,
     u.booked_at, u.completed_at, req.params.id, req.orgId]
  );
  res.json(await fullJob(req.orgId, req.params.id));
});

router.delete('/:id', async (req, res) => {
  await run('DELETE FROM jobs WHERE id = $1 AND org_id = $2', [req.params.id, req.orgId]);
  res.json({ ok: true });
});

router.put('/:id/estimate', async (req, res) => {
  const job = await one('SELECT id FROM jobs WHERE id = $1 AND org_id = $2', [req.params.id, req.orgId]);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  await tx(async (client) => {
    await client.query('DELETE FROM estimate_items WHERE job_id = $1', [job.id]);
    let total = 0;
    for (const it of items) {
      const qty = Number(it.quantity) || 0;
      const rate = Number(it.rate) || 0;
      total += qty * rate;
      await client.query('INSERT INTO estimate_items (org_id, job_id, name, rate_type, quantity, rate) VALUES ($1,$2,$3,$4,$5,$6)',
        [req.orgId, job.id, String(it.name || 'Item'), it.rate_type || 'flat', qty, rate]);
    }
    await client.query('UPDATE jobs SET estimated_total = $1 WHERE id = $2', [total, job.id]);
  });
  res.json(await fullJob(req.orgId, job.id));
});

router.put('/:id/inventory', async (req, res) => {
  const job = await one('SELECT id FROM jobs WHERE id = $1 AND org_id = $2', [req.params.id, req.orgId]);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  await tx(async (client) => {
    await client.query('DELETE FROM inventory_items WHERE job_id = $1', [job.id]);
    for (const it of items) {
      await client.query('INSERT INTO inventory_items (org_id, job_id, room, name, quantity, cubic_feet) VALUES ($1,$2,$3,$4,$5,$6)',
        [req.orgId, job.id, it.room || 'General', String(it.name || 'Item'), Number(it.quantity) || 1, Number(it.cubic_feet) || 0]);
    }
  });
  res.json(await fullJob(req.orgId, job.id));
});

router.put('/:id/dispatch', async (req, res) => {
  const job = await one('SELECT * FROM jobs WHERE id = $1 AND org_id = $2', [req.params.id, req.orgId]);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const { crew_ids = [], truck_ids = [], arrival_window, crew_notes } = req.body || {};
  await tx(async (client) => {
    await client.query('DELETE FROM job_crew WHERE job_id = $1', [job.id]);
    await client.query('DELETE FROM job_trucks WHERE job_id = $1', [job.id]);
    for (const cid of crew_ids) {
      // ensure the crew member belongs to this org
      const ok = (await client.query('SELECT 1 FROM crew_members WHERE id=$1 AND org_id=$2', [cid, req.orgId])).rowCount;
      if (ok) await client.query('INSERT INTO job_crew (job_id, crew_member_id) VALUES ($1,$2)', [job.id, cid]);
    }
    for (const tid of truck_ids) {
      const ok = (await client.query('SELECT 1 FROM trucks WHERE id=$1 AND org_id=$2', [tid, req.orgId])).rowCount;
      if (ok) await client.query('INSERT INTO job_trucks (job_id, truck_id) VALUES ($1,$2)', [job.id, tid]);
    }
    await client.query('UPDATE jobs SET arrival_window = $1, crew_notes = $2 WHERE id = $3',
      [arrival_window !== undefined ? arrival_window : job.arrival_window,
       crew_notes !== undefined ? crew_notes : job.crew_notes, job.id]);
  });
  await logActivity({ org_id: req.orgId, job_id: job.id, user_id: req.user.id, type: 'system', subject: 'Dispatch assignment updated' });
  res.json(await fullJob(req.orgId, job.id));
});

router.post('/:id/activities', async (req, res) => {
  const job = await one('SELECT id, customer_id FROM jobs WHERE id = $1 AND org_id = $2', [req.params.id, req.orgId]);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const { type = 'note', subject = '', body = '' } = req.body || {};
  await logActivity({ org_id: req.orgId, job_id: job.id, customer_id: job.customer_id, user_id: req.user.id, type, subject, body });
  const full = await fullJob(req.orgId, job.id);
  res.status(201).json(full.activities);
});

export default router;
