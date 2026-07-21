import { Router } from 'express';
import { one, tx, nextNumber } from '../db.js';

const router = Router();

// Data migration from another platform (SmartMoving, spreadsheets, other CRMs).
// The client parses the uploaded CSV and maps its columns to our fields, then
// posts clean records here. Each record can create a customer and, optionally,
// a job/lead — so a company can bring its whole book of business across at once.

const clean = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};
const num = (v) => {
  if (v === undefined || v === null || v === '') return 0;
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

// Best-effort date normalisation → 'YYYY-MM-DD' (accepts MM/DD/YYYY, ISO, etc.)
function normDate(v) {
  const s = clean(v);
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})/);
  if (m) {
    let [, mm, dd, yy] = m;
    if (yy.length === 2) yy = '20' + yy;
    return `${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

const VALID_STATUS = new Set(['lead', 'opportunity', 'booked', 'in_progress', 'completed', 'lost', 'cancelled']);
const VALID_TYPE = new Set(['local', 'long_distance', 'commercial', 'storage', 'labor_only']);

// Preview only — validate a batch and report what would be created, without
// touching the database. Lets the user confirm before committing.
router.post('/preview', async (req, res) => {
  const records = Array.isArray(req.body?.records) ? req.body.records : [];
  let customers = 0, jobs = 0;
  const problems = [];
  records.forEach((r, i) => {
    const first = clean(r.first_name) || clean(r.name);
    if (!first) { problems.push({ row: i + 1, error: 'Missing name' }); return; }
    customers++;
    if (req.body?.createJobs) jobs++;
  });
  res.json({ total: records.length, customers, jobs, problems: problems.slice(0, 20) });
});

router.post('/', async (req, res) => {
  const records = Array.isArray(req.body?.records) ? req.body.records : [];
  const createJobs = !!req.body?.createJobs;
  const sourceName = clean(req.body?.source) || 'Imported';
  const defaultStatus = VALID_STATUS.has(req.body?.defaultStatus) ? req.body.defaultStatus : 'lead';
  if (records.length === 0) return res.status(400).json({ error: 'No records to import' });
  if (records.length > 5000) return res.status(400).json({ error: 'Please import at most 5,000 rows at a time.' });

  const org = req.orgId;
  try {
    const result = await tx(async (client) => {
      // Cache lookups so we resolve names → ids without a query per row.
      const moveSizes = (await client.query('SELECT id, name FROM move_sizes WHERE org_id = $1', [org])).rows;
      const leadSources = (await client.query('SELECT id, name FROM lead_sources WHERE org_id = $1', [org])).rows;
      const findSize = (name) => {
        const n = clean(name);
        if (!n) return null;
        const hit = moveSizes.find((m) => m.name.toLowerCase() === n.toLowerCase())
          || moveSizes.find((m) => m.name.toLowerCase().includes(n.toLowerCase()));
        return hit ? hit.id : null;
      };
      // Ensure the import source exists so imported leads are attributed to it.
      let sourceRow = leadSources.find((s) => s.name.toLowerCase() === sourceName.toLowerCase());
      if (!sourceRow) {
        sourceRow = (await client.query(
          'INSERT INTO lead_sources (org_id, name) VALUES ($1, $2) RETURNING id, name', [org, sourceName]
        )).rows[0];
      }

      let customers = 0, jobs = 0, skipped = 0;
      const errors = [];
      for (let i = 0; i < records.length; i++) {
        const r = records[i] || {};
        // Allow a single "name" column to be split into first/last.
        let first = clean(r.first_name);
        let last = clean(r.last_name);
        if (!first && clean(r.name)) {
          const parts = clean(r.name).split(/\s+/);
          first = parts.shift();
          last = parts.join(' ');
        }
        if (!first) { skipped++; errors.push({ row: i + 1, error: 'Missing name' }); continue; }

        const cust = (await client.query(
          `INSERT INTO customers (org_id, first_name, last_name, email, phone, company, address, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
          [org, first, last || '', clean(r.email), clean(r.phone), clean(r.company),
           clean(r.address), clean(r.notes)]
        )).rows[0];
        customers++;

        if (createJobs) {
          const status = VALID_STATUS.has(clean(r.status)?.toLowerCase()) ? r.status.toLowerCase() : defaultStatus;
          const type = VALID_TYPE.has(clean(r.type)?.toLowerCase()) ? r.type.toLowerCase() : 'local';
          const jobNumber = await nextNumber(org, 'JOB', 'job', client);
          const jid = (await client.query(
            `INSERT INTO jobs (org_id, job_number, customer_id, status, type, move_date,
               origin_city, origin_state, origin_zip, dest_city, dest_state, dest_zip,
               move_size_id, lead_source_id, salesperson_id, estimated_total, notes,
               booked_at, completed_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING id`,
            [org, jobNumber, cust.id, status, type, normDate(r.move_date),
             clean(r.origin_city), clean(r.origin_state), clean(r.origin_zip),
             clean(r.dest_city), clean(r.dest_state), clean(r.dest_zip),
             findSize(r.move_size), sourceRow.id, req.user.id, num(r.estimated_total), clean(r.notes),
             ['booked', 'in_progress', 'completed'].includes(status) ? new Date().toISOString() : null,
             status === 'completed' ? new Date().toISOString() : null]
          )).rows[0].id;
          await client.query(
            'INSERT INTO activities (org_id, job_id, customer_id, user_id, type, subject) VALUES ($1,$2,$3,$4,$5,$6)',
            [org, jid, cust.id, req.user.id, 'system', `Imported from ${sourceName}`]
          );
          jobs++;
        }
      }
      return { customers, jobs, skipped, errors: errors.slice(0, 50) };
    });
    res.status(201).json({ ok: true, ...result });
  } catch (e) {
    console.error('Import failed:', e);
    res.status(500).json({ error: 'Import failed. Please check your file and try again.' });
  }
});

export default router;
