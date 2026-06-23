import { Router } from 'express';
import { q, one, run } from '../db.js';

const router = Router();

// --- Crew members ---
router.get('/crew', async (req, res) => {
  res.json(await q('SELECT * FROM crew_members WHERE org_id = $1 ORDER BY active DESC, name', [req.orgId]));
});

router.post('/crew', async (req, res) => {
  const { name, role = 'mover', phone = null, email = null, hourly_wage = 0 } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const row = await one('INSERT INTO crew_members (org_id, name, role, phone, email, hourly_wage) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [req.orgId, name, role, phone, email, hourly_wage]);
  res.status(201).json(row);
});

router.put('/crew/:id', async (req, res) => {
  const existing = await one('SELECT * FROM crew_members WHERE id = $1 AND org_id = $2', [req.params.id, req.orgId]);
  if (!existing) return res.status(404).json({ error: 'Crew member not found' });
  const u = { ...existing, ...req.body };
  const row = await one('UPDATE crew_members SET name=$1, role=$2, phone=$3, email=$4, hourly_wage=$5, active=$6 WHERE id=$7 AND org_id=$8 RETURNING *',
    [u.name, u.role, u.phone, u.email, u.hourly_wage, u.active ? 1 : 0, req.params.id, req.orgId]);
  res.json(row);
});

router.delete('/crew/:id', async (req, res) => {
  await run('DELETE FROM crew_members WHERE id = $1 AND org_id = $2', [req.params.id, req.orgId]);
  res.json({ ok: true });
});

// --- Trucks ---
router.get('/trucks', async (req, res) => {
  res.json(await q('SELECT * FROM trucks WHERE org_id = $1 ORDER BY name', [req.orgId]));
});

router.post('/trucks', async (req, res) => {
  const { name, capacity_cuft = 0, status = 'available' } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const row = await one('INSERT INTO trucks (org_id, name, capacity_cuft, status) VALUES ($1,$2,$3,$4) RETURNING *',
    [req.orgId, name, capacity_cuft, status]);
  res.status(201).json(row);
});

router.put('/trucks/:id', async (req, res) => {
  const existing = await one('SELECT * FROM trucks WHERE id = $1 AND org_id = $2', [req.params.id, req.orgId]);
  if (!existing) return res.status(404).json({ error: 'Truck not found' });
  const u = { ...existing, ...req.body };
  const row = await one('UPDATE trucks SET name=$1, capacity_cuft=$2, status=$3 WHERE id=$4 AND org_id=$5 RETURNING *',
    [u.name, u.capacity_cuft, u.status, req.params.id, req.orgId]);
  res.json(row);
});

router.delete('/trucks/:id', async (req, res) => {
  await run('DELETE FROM trucks WHERE id = $1 AND org_id = $2', [req.params.id, req.orgId]);
  res.json({ ok: true });
});

// --- Dispatch board ---
router.get('/dispatch', async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const jobs = await q(`
    SELECT j.id, j.job_number, j.status, j.type, j.move_date, j.arrival_window, j.estimated_total, j.crew_notes,
      j.origin_city, j.dest_city, c.first_name, c.last_name, c.phone AS customer_phone, ms.name AS move_size
    FROM jobs j
    JOIN customers c ON c.id = j.customer_id
    LEFT JOIN move_sizes ms ON ms.id = j.move_size_id
    WHERE j.org_id = $1 AND j.move_date = $2 AND j.status IN ('booked','in_progress','completed')
    ORDER BY j.arrival_window
  `, [req.orgId, date]);
  const crewAssign = await q(`
    SELECT jc.job_id, cm.id, cm.name, cm.role FROM job_crew jc JOIN crew_members cm ON cm.id = jc.crew_member_id
    WHERE cm.org_id = $1 AND jc.job_id IN (SELECT id FROM jobs WHERE org_id = $1 AND move_date = $2)
  `, [req.orgId, date]);
  const truckAssign = await q(`
    SELECT jt.job_id, t.id, t.name FROM job_trucks jt JOIN trucks t ON t.id = jt.truck_id
    WHERE t.org_id = $1 AND jt.job_id IN (SELECT id FROM jobs WHERE org_id = $1 AND move_date = $2)
  `, [req.orgId, date]);
  for (const j of jobs) {
    j.crew = crewAssign.filter((c) => c.job_id === j.id);
    j.trucks = truckAssign.filter((t) => t.job_id === j.id);
  }
  const busyCrew = new Set(crewAssign.map((c) => c.id));
  const busyTrucks = new Set(truckAssign.map((t) => t.id));
  const crew = (await q('SELECT * FROM crew_members WHERE org_id = $1 AND active = 1 ORDER BY name', [req.orgId]))
    .map((c) => ({ ...c, assigned: busyCrew.has(c.id) }));
  const trucks = (await q("SELECT * FROM trucks WHERE org_id = $1 AND status = 'available' ORDER BY name", [req.orgId]))
    .map((t) => ({ ...t, assigned: busyTrucks.has(t.id) }));
  res.json({ date, jobs, crew, trucks });
});

// --- Calendar ---
router.get('/calendar', async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const rows = await q(`
    SELECT j.id, j.job_number, j.status, j.type, j.move_date, j.arrival_window, j.estimated_total,
      c.first_name, c.last_name, ms.name AS move_size
    FROM jobs j
    JOIN customers c ON c.id = j.customer_id
    LEFT JOIN move_sizes ms ON ms.id = j.move_size_id
    WHERE j.org_id = $1 AND to_char(j.move_date, 'YYYY-MM') = $2 AND j.status NOT IN ('lost','cancelled')
    ORDER BY j.move_date
  `, [req.orgId, month]);
  res.json(rows);
});

export default router;
