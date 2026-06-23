import { nextNumber } from './db.js';

// Default configuration every new company starts with.
const DEFAULT_SETTINGS = {
  default_tax_rate: '8.25',
  review_message: 'Thanks for choosing us! How did your move go? Tap to leave a quick review.',
  review_auto_on_complete: 'true',
};
const LEAD_SOURCES = ['Google Ads', 'Website Form', 'Referral', 'Yelp', 'Phone Call', 'Repeat Customer'];
const MOVE_SIZES = [
  ['Studio', 400, 3, 2], ['1 Bedroom Apt', 600, 4, 2], ['2 Bedroom Apt', 900, 5, 3],
  ['3 Bedroom House', 1500, 7, 3], ['4 Bedroom House', 2200, 9, 4], ['Office (small)', 1200, 6, 3],
];
const SERVICES = [
  ['Moving labor (per hour, per crew)', 'hourly', 159],
  ['Travel fee', 'flat', 120],
  ['Packing service (per hour)', 'hourly', 89],
  ['Packing materials (per box)', 'per_unit', 4.5],
  ['Piano handling', 'flat', 250],
  ['Storage (per month)', 'flat', 199],
  ['Long distance (per mile)', 'per_unit', 4.25],
];
const TEMPLATES = [
  ['Quote follow-up', 'Your moving quote from {{company_name}}',
    'Hi {{first_name}},\n\nThanks for requesting a quote! Your estimated total is {{estimated_total}} for your move on {{move_date}}.\n\nReply or call us at {{company_phone}} to book your date — spots fill up fast!\n\n— {{salesperson}}'],
  ['Booking confirmation', 'You are booked! Move confirmation {{job_number}}',
    'Hi {{first_name}},\n\nYour move is confirmed for {{move_date}} (arrival window {{arrival_window}}).\n\nOrigin: {{origin_address}}\nDestination: {{dest_address}}\n\nSee you soon!\n{{company_name}}'],
  ['Payment reminder', 'Invoice {{invoice_number}} — balance due',
    'Hi {{first_name}},\n\nA friendly reminder that your invoice {{invoice_number}} has an outstanding balance.\n\nThank you!\n{{company_name}}'],
];

// Seeds default config for a brand-new organization. Runs inside a transaction.
export async function provisionOrg(client, orgId, companyName) {
  const settings = { company_name: companyName, ...DEFAULT_SETTINGS };
  for (const [k, v] of Object.entries(settings)) {
    await client.query('INSERT INTO settings (org_id, key, value) VALUES ($1,$2,$3)', [orgId, k, v]);
  }
  for (const name of LEAD_SOURCES) {
    await client.query('INSERT INTO lead_sources (org_id, name) VALUES ($1,$2)', [orgId, name]);
  }
  for (const [name, cf, hrs, movers] of MOVE_SIZES) {
    await client.query('INSERT INTO move_sizes (org_id, name, cubic_feet, est_hours, est_movers) VALUES ($1,$2,$3,$4,$5)', [orgId, name, cf, hrs, movers]);
  }
  for (const [name, type, rate] of SERVICES) {
    await client.query('INSERT INTO services (org_id, name, rate_type, rate) VALUES ($1,$2,$3,$4)', [orgId, name, type, rate]);
  }
  for (const [name, subject, body] of TEMPLATES) {
    await client.query('INSERT INTO email_templates (org_id, name, subject, body) VALUES ($1,$2,$3,$4)', [orgId, name, subject, body]);
  }
}

// Loads example customers, crew, trucks and jobs so a company can explore a populated
// workspace while testing. Returns the count created.
export async function loadSampleData(client, orgId, salespersonId) {
  // Crew & trucks
  const crewIds = [];
  for (const [name, role, phone, wage] of [
    ['Marcus Reed', 'foreman', '(555) 201-1111', 28], ['Jake Torres', 'driver', '(555) 201-2222', 24],
    ['Liam Brooks', 'mover', '(555) 201-3333', 20], ['Andre Hill', 'mover', '(555) 201-4444', 20],
    ['Chris Yoon', 'driver', '(555) 201-5555', 24], ['Tom Avery', 'mover', '(555) 201-6666', 19],
  ]) {
    const r = await client.query('INSERT INTO crew_members (org_id, name, role, phone, hourly_wage) VALUES ($1,$2,$3,$4,$5) RETURNING id', [orgId, name, role, phone, wage]);
    crewIds.push(r.rows[0].id);
  }
  const truckIds = [];
  for (const [name, cap] of [['Truck 1 — 26ft', 1700], ['Truck 2 — 26ft', 1700], ['Truck 3 — 16ft', 960]]) {
    const r = await client.query('INSERT INTO trucks (org_id, name, capacity_cuft) VALUES ($1,$2,$3) RETURNING id', [orgId, name, cap]);
    truckIds.push(r.rows[0].id);
  }

  const sizes = (await client.query('SELECT id FROM move_sizes WHERE org_id=$1 ORDER BY id', [orgId])).rows.map((r) => r.id);
  const sources = (await client.query('SELECT id FROM lead_sources WHERE org_id=$1 ORDER BY id', [orgId])).rows.map((r) => r.id);

  const first = ['James','Maria','Robert','Linda','Michael','Kim','David','Susan','Carlos','Emily','Brian','Aisha','Kevin','Nina','Paul','Grace'];
  const last = ['Walker','Garcia','Chen','Patel','Johnson','Lee','Nguyen','Brown','Lopez','Adams','Khan','Rivera','Olsen','Murphy'];
  const cities = [['Dallas','TX','75201'],['Plano','TX','75023'],['Frisco','TX','75034'],['Irving','TX','75038'],['Arlington','TX','76010'],['Fort Worth','TX','76102']];
  const statuses = ['lead','lead','lead','opportunity','opportunity','booked','booked','booked','in_progress','completed','completed','completed','lost'];
  const lostReasons = ['Price too high','Went with competitor','Move cancelled','No response'];
  const rand = (a) => a[Math.floor(Math.random() * a.length)];
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const today = new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);

  let created = 0;
  for (let i = 0; i < 32; i++) {
    const fn = rand(first), ln = rand(last);
    const created_at = new Date(today.getTime() - ri(0, 150) * 864e5);
    const cust = await client.query(
      'INSERT INTO customers (org_id, first_name, last_name, email, phone, created_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [orgId, fn, ln, `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.com`, `(555) ${ri(100,999)}-${ri(1000,9999)}`, created_at]
    );
    const custId = cust.rows[0].id;

    const status = rand(statuses);
    const msIdx = ri(0, sizes.length - 1);
    const [oc, os, oz] = rand(cities);
    const [dc, ds, dz] = rand(cities);
    let moveDate;
    if (status === 'completed') moveDate = new Date(created_at.getTime() + ri(5, 20) * 864e5);
    else if (status === 'in_progress') moveDate = today;
    else if (status === 'booked') moveDate = new Date(today.getTime() + ri(0, 21) * 864e5);
    else moveDate = new Date(today.getTime() + ri(7, 45) * 864e5);
    const hours = [3,4,5,7,9,6][msIdx] || 5;
    const crews = [2,2,3,3,4,3][msIdx] || 3;
    const estTotal = Math.round((hours * 159 * (crews - 1) + 120 + (Math.random() < 0.3 ? 250 : 0)) * 100) / 100;

    const jobNumber = await nextNumber(orgId, 'JOB', 'job', client);
    const bookedAt = ['booked','in_progress','completed'].includes(status) ? new Date(created_at.getTime() + ri(1,4) * 864e5) : null;
    const completedAt = status === 'completed' ? new Date(moveDate.getTime() + 864e5) : null;

    const job = await client.query(
      `INSERT INTO jobs (org_id, job_number, customer_id, status, type, move_date, arrival_window, move_size_id,
        origin_address, origin_city, origin_state, origin_zip, dest_address, dest_city, dest_state, dest_zip,
        distance_miles, lead_source_id, salesperson_id, estimated_total, created_at, booked_at, completed_at, lost_reason)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24) RETURNING id`,
      [orgId, jobNumber, custId, status, Math.random() < 0.15 ? 'long_distance' : 'local', fmt(moveDate),
       `${ri(8,10)}:00 - ${ri(11,13)}:00`, sizes[msIdx],
       `${ri(100,9999)} ${rand(['Oak','Main','Cedar','Elm'])} St`, oc, os, oz,
       `${ri(100,9999)} ${rand(['Pine','Lake','Hill','Park'])} Ave`, dc, ds, dz,
       ri(5,60), rand(sources), salespersonId, estTotal, created_at, bookedAt, completedAt,
       status === 'lost' ? rand(lostReasons) : null]
    );
    const jobId = job.rows[0].id;
    created++;

    await client.query('INSERT INTO estimate_items (org_id, job_id, name, rate_type, quantity, rate) VALUES ($1,$2,$3,$4,$5,$6)',
      [orgId, jobId, `Moving labor — ${crews} movers x ${hours} hrs`, 'hourly', hours, 159 * (crews - 1)]);
    await client.query('INSERT INTO estimate_items (org_id, job_id, name, rate_type, quantity, rate) VALUES ($1,$2,$3,$4,$5,$6)',
      [orgId, jobId, 'Travel fee', 'flat', 1, 120]);
    await client.query('INSERT INTO activities (org_id, job_id, customer_id, user_id, type, subject, body, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [orgId, jobId, custId, salespersonId, 'call', 'Initial intake call', 'Discussed move details and gave ballpark estimate.', created_at]);

    if (status === 'lead' || status === 'opportunity') {
      await client.query('INSERT INTO tasks (org_id, job_id, assigned_to, title, due_date) VALUES ($1,$2,$3,$4,$5)',
        [orgId, jobId, salespersonId, `Follow up with ${fn} ${ln}`, fmt(new Date(today.getTime() + ri(0,5) * 864e5))]);
    }

    if (['booked','in_progress','completed'].includes(status)) {
      await client.query('INSERT INTO job_crew (job_id, crew_member_id) VALUES ($1,$2)', [jobId, crewIds[ri(0,2)]]);
      await client.query('INSERT INTO job_crew (job_id, crew_member_id) VALUES ($1,$2)', [jobId, crewIds[ri(3,5)]]);
      await client.query('INSERT INTO job_trucks (job_id, truck_id) VALUES ($1,$2)', [jobId, rand(truckIds)]);
      const invNumber = await nextNumber(orgId, 'INV', 'invoice', client);
      const total = Math.round(estTotal * 1.0825 * 100) / 100;
      const invStatus = status === 'completed' ? 'paid' : 'sent';
      const inv = await client.query(
        'INSERT INTO invoices (org_id, invoice_number, job_id, status, subtotal, tax_rate, discount, total, due_date, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id',
        [orgId, invNumber, jobId, invStatus, estTotal, 8.25, 0, total, fmt(moveDate), bookedAt || created_at]
      );
      if (status === 'completed') {
        await client.query('INSERT INTO payments (org_id, invoice_id, amount, method, paid_at) VALUES ($1,$2,$3,$4,$5)',
          [orgId, inv.rows[0].id, total, rand(['card','check','cash']), completedAt]);
      } else if (Math.random() < 0.5) {
        await client.query('INSERT INTO payments (org_id, invoice_id, amount, method, paid_at) VALUES ($1,$2,$3,$4,$5)',
          [orgId, inv.rows[0].id, Math.round(total * 0.25 * 100) / 100, 'card', bookedAt]);
        await client.query("UPDATE invoices SET status='partial' WHERE id=$1", [inv.rows[0].id]);
      }
    }
  }
  return created;
}
