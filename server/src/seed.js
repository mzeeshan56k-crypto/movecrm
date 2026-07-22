import { nextNumber } from './db.js';

// Realistic demo data for the owner/showcase account, so the whole product can
// be shown to prospective clients with a full pipeline, dispatch board, billing,
// reviews and reporting already populated. Everything is scoped to one org and
// can be wiped again from Settings ("Reset workspace").

const now = () => new Date();
const dayShift = (n) => { const d = now(); d.setDate(d.getDate() + n); return d; };
const at = (n, h = 10) => { const d = dayShift(n); d.setHours(h, 0, 0, 0); return d; };
const ymd = (d) => d.toISOString().slice(0, 10);
const iso = (d) => d.toISOString();

const CUSTOMERS = [
  ['Olivia', 'Bennett', 'olivia.bennett@gmail.com', '(415) 555-0142', '', '128 Elm St', 'San Francisco', 'CA', '94110'],
  ['Ethan', 'Carter', 'ethan.carter@outlook.com', '(415) 555-0169', '', '904 Pine Ave', 'Oakland', 'CA', '94607'],
  ['Sophia', 'Nguyen', 'sophia.nguyen@gmail.com', '(650) 555-0188', '', '55 Marina Blvd', 'San Mateo', 'CA', '94403'],
  ['Liam', 'Patel', 'liam.patel@yahoo.com', '(408) 555-0155', '', '2201 Alder Ct', 'San Jose', 'CA', '95126'],
  ['Emma', 'Rodriguez', 'emma.rodriguez@gmail.com', '(415) 555-0177', '', '77 Hayes St', 'San Francisco', 'CA', '94102'],
  ['Noah', 'Kim', 'noah.kim@gmail.com', '(510) 555-0133', '', '410 Grand Ave', 'Berkeley', 'CA', '94704'],
  ['Ava', 'Thompson', 'ava.thompson@proton.me', '(415) 555-0121', '', '319 Union St', 'San Francisco', 'CA', '94133'],
  ['Mason', 'Garcia', 'mason.garcia@gmail.com', '(925) 555-0198', '', '88 Camino Real', 'Walnut Creek', 'CA', '94596'],
  ['Isabella', 'Foster', 'bella.foster@gmail.com', '(415) 555-0110', '', '640 Divisadero St', 'San Francisco', 'CA', '94117'],
  ['Lucas', 'Wright', 'lucas.wright@gmail.com', '(707) 555-0164', '', '12 Vine St', 'Napa', 'CA', '94559'],
  ['Mia', 'Alvarez', 'mia.alvarez@gmail.com', '(415) 555-0102', 'Bright Coworking', '500 Howard St', 'San Francisco', 'CA', '94105'],
  ['Henry', 'Cooper', 'henry.cooper@gmail.com', '(415) 555-0187', 'Cooper & Lane LLP', '1 Market St', 'San Francisco', 'CA', '94105'],
];

const CREW = [
  ['Marcus Lee', 'foreman', '(415) 555-0311', 34],
  ['Diego Ramirez', 'driver', '(415) 555-0312', 29],
  ['Tyrone Baxter', 'mover', '(415) 555-0313', 25],
  ['Sam Okafor', 'mover', '(415) 555-0314', 25],
  ['Priya Shah', 'foreman', '(415) 555-0315', 33],
  ['Kevin Doyle', 'driver', '(415) 555-0316', 28],
];

const TRUCKS = [
  ['Truck 1 (16 ft)', 900, 'available'],
  ['Truck 2 (26 ft)', 1700, 'available'],
  ['Truck 3 (26 ft)', 1700, 'available'],
  ['Truck 4 (16 ft)', 900, 'maintenance'],
];

export async function seedDemoData(client, orgId, userId) {
  const moveSizes = (await client.query('SELECT id, name, est_hours, est_movers FROM move_sizes WHERE org_id=$1 ORDER BY id', [orgId])).rows;
  const leadSources = (await client.query('SELECT id, name FROM lead_sources WHERE org_id=$1 ORDER BY id', [orgId])).rows;
  const taxRow = (await client.query("SELECT value FROM settings WHERE org_id=$1 AND key='default_tax_rate'", [orgId])).rows[0];
  const taxRate = taxRow ? parseFloat(taxRow.value) || 8.25 : 8.25;

  const size = (n) => moveSizes.find((s) => s.name === n) || moveSizes[0];
  const source = (n) => leadSources.find((s) => s.name.toLowerCase().includes(n.toLowerCase())) || leadSources[0];

  // Customers
  const cust = {};
  for (const [first, last, email, phone, company, addr, city, state, zip] of CUSTOMERS) {
    const full = `${addr}, ${city}, ${state} ${zip}`;
    const id = (await client.query(
      'INSERT INTO customers (org_id, first_name, last_name, email, phone, company, address, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
      [orgId, first, last, email, phone, company || null, full, iso(dayShift(-Math.floor(Math.random() * 40) - 5))]
    )).rows[0].id;
    cust[`${first} ${last}`] = id;
  }

  // Crew & trucks
  const crewIds = [];
  for (const [name, role, phone, wage] of CREW) {
    const id = (await client.query(
      'INSERT INTO crew_members (org_id, name, role, phone, hourly_wage) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [orgId, name, role, phone, wage]
    )).rows[0].id;
    crewIds.push(id);
  }
  const truckIds = [];
  for (const [name, cap, status] of TRUCKS) {
    const id = (await client.query(
      'INSERT INTO trucks (org_id, name, capacity_cuft, status) VALUES ($1,$2,$3,$4) RETURNING id',
      [orgId, name, cap, status]
    )).rows[0].id;
    truckIds.push(id);
  }

  const addr = (a, city, zip, floor) => ({ addr: a, city, state: 'CA', zip, floor });

  // Creates a job and returns its id. Estimate items drive the estimated_total.
  async function job(o) {
    const num = await nextNumber(orgId, 'JOB', 'job', client);
    const s = size(o.sizeName);
    const src = source(o.sourceName);
    const jobId = (await client.query(
      `INSERT INTO jobs (org_id, job_number, customer_id, status, type, move_date, arrival_window, move_size_id,
         origin_address, origin_city, origin_state, origin_zip, origin_floor,
         dest_address, dest_city, dest_state, dest_zip, dest_floor,
         distance_miles, lead_source_id, salesperson_id, estimated_total, notes, lost_reason,
         created_at, booked_at, completed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, $9,$10,$11,$12,$13, $14,$15,$16,$17,$18, $19,$20,$21,$22,$23,$24, $25,$26,$27) RETURNING id`,
      [orgId, num, o.customerId, o.status, o.type, o.moveDate ? ymd(o.moveDate) : null, o.arrival || null, s.id,
        o.origin.addr, o.origin.city, o.origin.state, o.origin.zip, o.origin.floor || null,
        o.dest.addr, o.dest.city, o.dest.state, o.dest.zip, o.dest.floor || null,
        o.distance || null, src.id, userId, 0, o.notes || null, o.lostReason || null,
        iso(o.createdAt || dayShift(-14)), o.bookedAt ? iso(o.bookedAt) : null, o.completedAt ? iso(o.completedAt) : null]
    )).rows[0].id;

    // Estimate line items
    let subtotal = 0;
    const items = o.items || [];
    for (const [name, rateType, qty, rate] of items) {
      subtotal += qty * rate;
      await client.query(
        'INSERT INTO estimate_items (org_id, job_id, name, rate_type, quantity, rate) VALUES ($1,$2,$3,$4,$5,$6)',
        [orgId, jobId, name, rateType, qty, rate]
      );
    }
    subtotal = Math.round(subtotal * 100) / 100;
    if (subtotal > 0) {
      await client.query('UPDATE jobs SET estimated_total = $1 WHERE id = $2', [subtotal, jobId]);
    }

    // Crew + truck assignments
    for (const cid of o.crew || []) await client.query('INSERT INTO job_crew (job_id, crew_member_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [jobId, cid]);
    for (const tid of o.trucks || []) await client.query('INSERT INTO job_trucks (job_id, truck_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [jobId, tid]);

    // Inventory
    for (const [room, name, q, cf] of o.inventory || []) {
      await client.query('INSERT INTO inventory_items (org_id, job_id, room, name, quantity, cubic_feet) VALUES ($1,$2,$3,$4,$5,$6)', [orgId, jobId, room, name, q, cf]);
    }

    // Activities
    for (const [type, subject, body, whenDays] of o.activities || []) {
      await client.query(
        'INSERT INTO activities (org_id, job_id, customer_id, user_id, type, subject, body, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [orgId, jobId, o.customerId, userId, type, subject, body, iso(dayShift(whenDays))]
      );
    }

    // Invoice + payments
    if (o.invoice) {
      const disc = o.invoice.discount || 0;
      const total = Math.round((subtotal * (1 + taxRate / 100) - disc) * 100) / 100;
      const invNum = await nextNumber(orgId, 'INV', 'invoice', client);
      let paid = 0;
      const invId = (await client.query(
        'INSERT INTO invoices (org_id, invoice_number, job_id, status, subtotal, tax_rate, discount, total, due_date, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id',
        [orgId, invNum, jobId, 'sent', subtotal, taxRate, disc, total, ymd(o.invoice.dueDays != null ? dayShift(o.invoice.dueDays) : dayShift(7)), iso(o.invoice.createdAt || dayShift(-3))]
      )).rows[0].id;
      for (const p of o.invoice.payments || []) {
        const amt = p.full ? total : p.amount;
        paid += amt;
        await client.query(
          'INSERT INTO payments (org_id, invoice_id, amount, method, reference, paid_at) VALUES ($1,$2,$3,$4,$5,$6)',
          [orgId, invId, Math.round(amt * 100) / 100, p.method || 'card', p.reference || null, iso(p.whenDays != null ? dayShift(p.whenDays) : now())]
        );
      }
      let status = 'sent';
      if (paid >= total && total > 0) status = 'paid';
      else if (paid > 0) status = 'partial';
      await client.query('UPDATE invoices SET status = $1 WHERE id = $2', [status, invId]);
    }

    return jobId;
  }

  const c = cust;
  const labor = (hrs, crews = 1) => ['Moving labor (per hour, per crew)', 'hourly', hrs * crews, 159];
  const travel = ['Travel fee', 'flat', 1, 120];
  const packHrs = (h) => ['Packing service (per hour)', 'hourly', h, 89];
  const boxes = (n) => ['Packing materials (per box)', 'per_unit', n, 4.5];

  // ---- Leads (top of funnel) ----
  await job({
    customerId: c['Olivia Bennett'], status: 'lead', type: 'local', sizeName: '1 Bedroom Apt', sourceName: 'website',
    origin: addr('128 Elm St', 'San Francisco', '94110', '2'), dest: addr('455 Fell St', 'San Francisco', '94102', '3'),
    distance: 4, createdAt: dayShift(-1), moveDate: dayShift(18),
    activities: [['note', 'New website lead', 'Requested a quote for a 1BR move next month.', -1]],
  });
  await job({
    customerId: c['Noah Kim'], status: 'lead', type: 'local', sizeName: 'Studio', sourceName: 'Yelp',
    origin: addr('410 Grand Ave', 'Berkeley', '94704', '1'), dest: addr('1201 Broadway', 'Oakland', '94612', '5'),
    distance: 6, createdAt: dayShift(-2), moveDate: dayShift(24),
    activities: [['call', 'Inbound call', 'Called about pricing, asked us to text a quote.', -2]],
  });
  await job({
    customerId: c['Lucas Wright'], status: 'lead', type: 'long_distance', sizeName: '2 Bedroom Apt', sourceName: 'Google',
    origin: addr('12 Vine St', 'Napa', '94559', '1'), dest: addr('88 Sunset Dr', 'Sacramento', '95814', '2'),
    distance: 62, createdAt: dayShift(-3), moveDate: dayShift(30),
  });

  // ---- Opportunities (quoted) ----
  await job({
    customerId: c['Ethan Carter'], status: 'opportunity', type: 'local', sizeName: '2 Bedroom Apt', sourceName: 'Referral',
    origin: addr('904 Pine Ave', 'Oakland', '94607', '2'), dest: addr('300 Ivy St', 'San Francisco', '94102', '1'),
    distance: 12, createdAt: dayShift(-5), moveDate: dayShift(12),
    items: [labor(5, 1), travel, boxes(20)],
    activities: [['email', 'Quote sent', 'Emailed the estimate, following up in 2 days.', -4]],
  });
  await job({
    customerId: c['Mia Alvarez'], status: 'opportunity', type: 'commercial', sizeName: 'Office (small)', sourceName: 'website',
    origin: addr('500 Howard St', 'San Francisco', '94105', '4'), dest: addr('55 2nd St', 'San Francisco', '94105', '9'),
    distance: 2, createdAt: dayShift(-4), moveDate: dayShift(15),
    items: [labor(6, 2), travel, packHrs(4)],
    activities: [['note', 'Site walkthrough', 'Toured both offices, needs weekend move to avoid downtime.', -3]],
  });

  // ---- Booked (upcoming) ----
  await job({
    customerId: c['Sophia Nguyen'], status: 'booked', type: 'local', sizeName: '3 Bedroom House', sourceName: 'Referral',
    origin: addr('55 Marina Blvd', 'San Mateo', '94403', '1'), dest: addr('7 Oak Knoll', 'San Carlos', '94070', '1'),
    distance: 9, createdAt: dayShift(-8), bookedAt: dayShift(-6), moveDate: dayShift(4), arrival: '8:00 AM - 10:00 AM',
    crew: [crewIds[0], crewIds[2], crewIds[3]], trucks: [truckIds[1]],
    items: [labor(7, 1), travel, boxes(35), packHrs(3)],
    inventory: [['Living Room', 'Sofa (3-seat)', 1, 50], ['Living Room', 'TV 65in', 1, 12], ['Bedroom', 'Queen bed set', 2, 65], ['Kitchen', 'Boxes', 18, 3]],
    activities: [['note', 'Booked', 'Deposit collected, move confirmed for the weekend.', -6]],
    invoice: { payments: [{ amount: 300, method: 'card', reference: 'Deposit', whenDays: -6 }], dueDays: 4, createdAt: dayShift(-6) },
  });
  await job({
    customerId: c['Henry Cooper'], status: 'booked', type: 'commercial', sizeName: 'Office (small)', sourceName: 'Google',
    origin: addr('1 Market St', 'San Francisco', '94105', '20'), dest: addr('101 California St', 'San Francisco', '94111', '15'),
    distance: 1, createdAt: dayShift(-7), bookedAt: dayShift(-5), moveDate: dayShift(7), arrival: '6:00 PM - 8:00 PM',
    crew: [crewIds[4], crewIds[1], crewIds[3]], trucks: [truckIds[2]],
    items: [labor(8, 2), travel, boxes(60)],
    activities: [['email', 'Confirmation sent', 'After-hours move to avoid business disruption.', -5]],
    invoice: { payments: [{ amount: 500, method: 'ach', reference: 'Deposit', whenDays: -5 }], dueDays: 7, createdAt: dayShift(-5) },
  });
  await job({
    customerId: c['Mason Garcia'], status: 'booked', type: 'local', sizeName: '4 Bedroom House', sourceName: 'website',
    origin: addr('88 Camino Real', 'Walnut Creek', '94596', '1'), dest: addr('240 Rincon Rd', 'Danville', '94526', '1'),
    distance: 11, createdAt: dayShift(-6), bookedAt: dayShift(-4), moveDate: dayShift(9), arrival: '9:00 AM - 11:00 AM',
    crew: [crewIds[0], crewIds[2], crewIds[3], crewIds[5]], trucks: [truckIds[1], truckIds[2]],
    items: [labor(9, 2), travel, boxes(50)],
    activities: [['note', 'Large move', 'Two-truck job, foreman briefed.', -4]],
  });

  // ---- In progress (today) ----
  await job({
    customerId: c['Emma Rodriguez'], status: 'in_progress', type: 'local', sizeName: '2 Bedroom Apt', sourceName: 'Repeat',
    origin: addr('77 Hayes St', 'San Francisco', '94102', '3'), dest: addr('19 Corbett Ave', 'San Francisco', '94114', '2'),
    distance: 3, createdAt: dayShift(-10), bookedAt: dayShift(-8), moveDate: dayShift(0), arrival: '8:00 AM - 10:00 AM',
    crew: [crewIds[4], crewIds[2]], trucks: [truckIds[0]],
    items: [labor(6, 1), travel, boxes(25)],
    activities: [['note', 'Crew on site', 'Team arrived on time, loading in progress.', 0]],
    invoice: { payments: [], dueDays: 1, createdAt: dayShift(-1) },
  });

  // ---- Completed (with paid/partial invoices) ----
  const completed = [
    { name: 'Ava Thompson', type: 'local', sizeName: '1 Bedroom Apt', done: -3, items: [labor(4, 1), travel, boxes(15)], pay: 'full', payWhen: -3, from: addr('319 Union St', 'San Francisco', '94133', '2'), to: addr('66 Chestnut St', 'San Francisco', '94123', '1'), dist: 3, review: 5 },
    { name: 'Liam Patel', type: 'long_distance', sizeName: '2 Bedroom Apt', done: -8, items: [labor(6, 1), ['Long distance (per mile)', 'per_unit', 48, 4.25], boxes(30)], pay: 'full', payWhen: -7, from: addr('2201 Alder Ct', 'San Jose', '95126', '1'), to: addr('900 G St', 'Modesto', '95354', '1'), dist: 48, review: 5 },
    { name: 'Isabella Foster', type: 'local', sizeName: 'Studio', done: -12, items: [labor(3, 1), travel], pay: 'full', payWhen: -12, from: addr('640 Divisadero St', 'San Francisco', '94117', '4'), to: addr('120 Guerrero St', 'San Francisco', '94103', '2'), dist: 2, review: 4 },
    { name: 'Noah Kim', type: 'local', sizeName: '3 Bedroom House', done: -18, items: [labor(7, 2), travel, boxes(40), packHrs(4)], pay: 'partial', payWhen: -17, from: addr('410 Grand Ave', 'Berkeley', '94704', '1'), to: addr('15 Vista Ln', 'Orinda', '94563', '1'), dist: 8, review: 3 },
    { name: 'Ethan Carter', type: 'commercial', sizeName: 'Office (small)', done: -22, items: [labor(8, 2), travel, boxes(55)], pay: 'full', payWhen: -21, from: addr('904 Pine Ave', 'Oakland', '94607', '3'), to: addr('1330 Broadway', 'Oakland', '94612', '7'), dist: 2, review: 5 },
    { name: 'Sophia Nguyen', type: 'local', sizeName: '2 Bedroom Apt', done: -28, items: [labor(5, 1), travel, boxes(20)], pay: 'full', payWhen: -27, from: addr('55 Marina Blvd', 'San Mateo', '94403', '1'), to: addr('88 Elm Ave', 'Burlingame', '94010', '1'), dist: 5, review: null },
  ];
  for (const j of completed) {
    const jobId = await job({
      customerId: c[j.name], status: 'completed', type: j.type, sizeName: j.sizeName, sourceName: 'Referral',
      origin: j.from, dest: j.to, distance: j.dist,
      createdAt: dayShift(j.done - 12), bookedAt: dayShift(j.done - 8), completedAt: at(j.done, 16), moveDate: dayShift(j.done),
      crew: [crewIds[0], crewIds[2], crewIds[3]], trucks: [truckIds[1]],
      items: j.items,
      activities: [['note', 'Job completed', 'Move finished, customer signed off.', j.done]],
      invoice: {
        createdAt: dayShift(j.done),
        dueDays: j.done + 7,
        payments: j.pay === 'full'
          ? [{ full: true, method: 'card', reference: 'Paid in full', whenDays: j.payWhen }]
          : [{ amount: 600, method: 'cash', reference: 'Partial payment', whenDays: j.payWhen }],
      },
    });
    // Review request (some reviewed, routed by rating; one still pending)
    if (j.review) {
      await client.query(
        `INSERT INTO review_requests (org_id, job_id, customer_id, token, channel, status, rating, comment, created_at, sent_at, reviewed_at)
         VALUES ($1,$2,$3,$4,'link','reviewed',$5,$6,$7,$7,$8)`,
        [orgId, jobId, c[j.name], 'demo-' + Math.random().toString(36).slice(2, 12), j.review,
          j.review >= 4 ? 'Fantastic crew, fast and careful. Highly recommend!' : 'Move was okay but ran a bit long.',
          iso(dayShift(j.done)), iso(dayShift(j.done + 1))]
      );
    } else {
      await client.query(
        `INSERT INTO review_requests (org_id, job_id, customer_id, token, channel, status, created_at, sent_at)
         VALUES ($1,$2,$3,$4,'link','sent',$5,$5)`,
        [orgId, jobId, c[j.name], 'demo-' + Math.random().toString(36).slice(2, 12), iso(dayShift(j.done))]
      );
    }
  }

  // ---- Lost ----
  await job({
    customerId: c['Lucas Wright'], status: 'lost', type: 'local', sizeName: '1 Bedroom Apt', sourceName: 'Google',
    origin: addr('12 Vine St', 'Napa', '94559', '1'), dest: addr('44 River Rd', 'Napa', '94558', '1'),
    distance: 4, createdAt: dayShift(-20), moveDate: dayShift(-6), lostReason: 'Price - went with a cheaper competitor',
    items: [labor(4, 1), travel],
    activities: [['note', 'Lost', 'Chose a lower-cost mover. Followed up for future business.', -8]],
  });

  // ---- Standalone tasks (follow-ups) ----
  const tasks = [
    ['Follow up with Olivia on 1BR quote', 2, 0],
    ['Send Ethan the updated estimate', 1, 0],
    ['Confirm crew for Sophia\'s Saturday move', 3, 0],
    ['Call Mia to schedule office walkthrough', 1, 0],
    ['Request Google review from Ava', -1, 1],
    ['Order more moving blankets', 4, 0],
  ];
  for (const [title, dueDays, done] of tasks) {
    await client.query(
      'INSERT INTO tasks (org_id, assigned_to, title, due_date, completed, created_at) VALUES ($1,$2,$3,$4,$5,$6)',
      [orgId, userId, title, ymd(dayShift(dueDays)), done, iso(dayShift(-5))]
    );
  }

  // ---- Standalone inbound calls ----
  const calls = [
    ['inbound', '(415) 555-0142', 'received', 92, c['Olivia Bennett'], 'Asked about availability for next month.', -1],
    ['inbound', '(650) 555-0188', 'received', 145, c['Sophia Nguyen'], 'Confirmed arrival window.', -2],
    ['inbound', '(408) 555-0155', 'missed', 0, null, 'Missed call, no voicemail.', -2],
    ['outbound', '(415) 555-0169', 'completed', 210, c['Ethan Carter'], 'Reviewed the quote line by line.', -3],
  ];
  for (const [direction, from, status, dur, customerId, notes, whenDays] of calls) {
    await client.query(
      'INSERT INTO calls (org_id, direction, from_number, to_number, status, duration_seconds, customer_id, notes, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [orgId, direction, from, '(415) 555-0100', status, dur, customerId, notes, iso(dayShift(whenDays))]
    );
  }

  const counts = await client.query('SELECT (SELECT COUNT(*) FROM customers WHERE org_id=$1)::int AS customers, (SELECT COUNT(*) FROM jobs WHERE org_id=$1)::int AS jobs', [orgId]);
  return counts.rows[0];
}
