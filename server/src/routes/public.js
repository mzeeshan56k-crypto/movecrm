// Public endpoints — no login required. Each company is identified by the
// unguessable public_key in the URL. This powers automatic lead capture:
//   - the hosted "Get a Quote" form and any embedded/website form
//   - webhooks from lead providers (Zapier, landing pages, etc.)
//   - Twilio phone webhooks (inbound calls -> recorded + logged as leads)
import { Router } from 'express';
import { q, one, run, tx, nextNumber } from '../db.js';
import { ingestLead, mapWhatConverts, mapGeneric } from '../integrations.js';

const router = Router();

// A public key identifies a lead-capture website, which belongs to an org.
// Falls back to the org's own key for backward compatibility.
async function orgByKey(publicKey) {
  const site = await one(
    `SELECT o.id, o.name, w.id AS website_id FROM websites w
     JOIN organizations o ON o.id = w.org_id WHERE w.public_key = $1 AND w.active = 1`,
    [publicKey]
  );
  if (site) return site;
  return one('SELECT id, name, NULL::int AS website_id FROM organizations WHERE public_key = $1', [publicKey]);
}

// Company info for the hosted quote form.
router.get('/org/:key', async (req, res) => {
  const org = await orgByKey(req.params.key);
  if (!org) return res.status(404).json({ error: 'Unknown company link' });
  const sizes = await q('SELECT id, name FROM move_sizes WHERE org_id = $1 ORDER BY id', [org.id]);
  res.json({ company_name: org.name, move_sizes: sizes });
});

// Create a lead from a form submission or webhook. Accepts JSON or form-encoded.
router.post('/lead/:key', async (req, res) => {
  const org = await orgByKey(req.params.key);
  if (!org) return res.status(404).json({ error: 'Unknown company link' });
  const b = req.body || {};
  // Google Ads Lead Form delivers fields inside a user_column_data array rather
  // than flat keys. Flatten it so Google Ads leads populate correctly.
  if (Array.isArray(b.user_column_data)) {
    for (const col of b.user_column_data) {
      const id = String(col.column_id || col.column_name || '').toUpperCase();
      const val = col.string_value ?? col.value ?? '';
      if (!val) continue;
      if (/FIRST/.test(id)) b.first_name = b.first_name || val;
      else if (/LAST/.test(id)) b.last_name = b.last_name || val;
      else if (/FULL.?NAME|^NAME$/.test(id)) b.name = b.name || val;
      else if (/PHONE/.test(id)) b.phone = b.phone || val;
      else if (/EMAIL/.test(id)) b.email = b.email || val;
      else if (/CITY/.test(id)) b.origin_city = b.origin_city || val;
      else if (/POSTAL|ZIP/.test(id)) b.origin_zip = b.origin_zip || val;
    }
  }
  // Accept the field names different lead sources use (Google Ads, Facebook Lead
  // Ads, Yelp, Zapier, call trackers, plain forms) so every source works without
  // custom mapping.
  const S = (v) => (v == null ? '' : String(v)).trim();
  const fullName = S(b.name || b.full_name || b.contact_name || b.fullName);
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const firstName = S(b.first_name || b.firstName || b.fname || nameParts[0]) || 'Lead';
  const lastName = S(b.last_name || b.lastName || b.lname || nameParts.slice(1).join(' '));
  const phone = S(b.phone || b.phone_number || b.phoneNumber || b.caller_number || b.mobile || b.tel);
  const email = S(b.email || b.email_address || b.emailAddress);
  if (!phone && !email) return res.status(400).json({ error: 'A phone or email is required' });

  const moveDate = S(b.move_date || b.moveDate || b.date) || null;
  const moveSize = S(b.move_size || b.moveSize || b.size);
  const jobType = S(b.type || b.move_type || b.moveType) || 'local';
  const message = S(b.notes || b.message || b.comments || b.details) || null;

  // The lead source can come from the body or the ?source= query param, so each
  // integration (Google Ads, Yelp, Facebook, Zapier) gets a tagged webhook URL.
  const sourceName = S(b.source || req.query.source || 'Website Form');
  try {
    const jobNumber = await tx(async (client) => {
      const source = (await client.query(
        'SELECT id FROM lead_sources WHERE org_id = $1 AND name ILIKE $2 LIMIT 1', [org.id, sourceName]
      )).rows[0] || (await client.query(
        'INSERT INTO lead_sources (org_id, name) VALUES ($1, $2) RETURNING id', [org.id, sourceName]
      )).rows[0];

      const customer = (await client.query(
        'INSERT INTO customers (org_id, first_name, last_name, email, phone) VALUES ($1,$2,$3,$4,$5) RETURNING id',
        [org.id, firstName, lastName, email || null, phone || null]
      )).rows[0];

      let moveSizeId = null;
      if (moveSize) {
        const ms = (await client.query(
          'SELECT id FROM move_sizes WHERE org_id = $1 AND name ILIKE $2 LIMIT 1', [org.id, `%${moveSize}%`]
        )).rows[0];
        moveSizeId = ms?.id || null;
      }

      const number = await nextNumber(org.id, 'JOB', 'job', client);
      const job = (await client.query(
        `INSERT INTO jobs (org_id, job_number, customer_id, status, type, move_date, move_size_id,
           origin_address, origin_city, origin_state, origin_zip,
           dest_address, dest_city, dest_state, dest_zip, lead_source_id, notes)
         VALUES ($1,$2,$3,'lead',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
        [org.id, number, customer.id, jobType, moveDate, moveSizeId,
         S(b.origin_address) || null, S(b.origin_city) || null, S(b.origin_state) || null, S(b.origin_zip) || null,
         S(b.dest_address) || null, S(b.dest_city) || null, S(b.dest_state) || null, S(b.dest_zip) || null,
         source.id, message]
      )).rows[0];

      await client.query(
        'INSERT INTO activities (org_id, job_id, customer_id, type, subject, body) VALUES ($1,$2,$3,$4,$5,$6)',
        [org.id, job.id, customer.id, 'system', `New inquiry via ${sourceName}`, message || '']
      );
      return number;
    });
    res.status(201).json({ ok: true, reference: jobNumber, message: 'Thanks! We received your request and will contact you shortly.' });
  } catch (e) {
    console.error('Public lead failed:', e);
    res.status(500).json({ error: 'Could not submit your request. Please call us instead.' });
  }
});

// ---------------------------------------------------------------------------
// Lead-tracking integrations (WhatConverts, MarketingClarity). Each company
// pastes its unique webhook URL into the provider; every tracked call/form/chat
// is POSTed here as JSON and becomes an attributed lead — the SmartMoving model.
// Integrations require a paid plan (same as lead-capture websites).
// ---------------------------------------------------------------------------
async function orgForIntegration(key) {
  const org = await orgByKey(key);
  if (!org) return { code: 404 };
  const plan = (await one('SELECT plan FROM organizations WHERE id = $1', [org.id]))?.plan;
  if (plan === 'trial') return { code: 402 };
  return { org };
}

function handleProviderWebhook(provider, mapFn) {
  return async (req, res) => {
    const { org, code } = await orgForIntegration(req.params.key);
    if (code === 404) return res.status(404).json({ error: 'Unknown company link' });
    if (code === 402) return res.status(402).json({ error: 'Lead integrations require a paid plan.' });
    try {
      const lead = mapFn(req.body || {});
      const r = await tx((client) => ingestLead(client, org, provider, lead));
      res.status(r.duplicate ? 200 : 201).json({ ok: true, duplicate: r.duplicate, reference: r.jobNumber });
    } catch (e) {
      console.error(`${provider} webhook failed:`, e);
      res.status(e.status || 500).json({ error: e.message || 'Could not process lead' });
    }
  };
}

router.post('/whatconverts/:key', handleProviderWebhook('whatconverts', mapWhatConverts));
router.post('/marketingclarity/:key', handleProviderWebhook('marketingclarity', (b) => mapGeneric(b, 'MarketingClarity')));

// ---------------------------------------------------------------------------
// Twilio voice webhooks. Point a Twilio number's "A call comes in" webhook at
// POST /api/public/voice/<key>. Twilio sends form-encoded fields (From, To,
// CallSid). We answer with TwiML, record a voicemail, and log the call as a
// lead in the CRM. The recording callback stores the audio URL.
// ---------------------------------------------------------------------------

const xml = (body) => `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

router.post('/voice/:key', async (req, res) => {
  res.type('text/xml');
  const org = await orgByKey(req.params.key);
  if (!org) return res.send(xml('<Say>This number is not configured. Goodbye.</Say>'));

  const from = req.body?.From || 'unknown';
  const to = req.body?.To || null;
  const callSid = req.body?.CallSid || null;

  try {
    await tx(async (client) => {
      // Match an existing customer by phone, otherwise create one + a lead.
      let customer = (await client.query(
        'SELECT id, first_name, last_name FROM customers WHERE org_id = $1 AND phone = $2 LIMIT 1', [org.id, from]
      )).rows[0];
      let jobId = null;

      if (customer) {
        const openJob = (await client.query(
          `SELECT id FROM jobs WHERE org_id = $1 AND customer_id = $2 AND status IN ('lead','opportunity','booked','in_progress')
           ORDER BY created_at DESC LIMIT 1`, [org.id, customer.id]
        )).rows[0];
        jobId = openJob?.id || null;
      } else {
        customer = (await client.query(
          'INSERT INTO customers (org_id, first_name, last_name, phone) VALUES ($1,$2,$3,$4) RETURNING id',
          [org.id, 'Caller', from, from]
        )).rows[0];
        const source = (await client.query(
          "SELECT id FROM lead_sources WHERE org_id = $1 AND name ILIKE 'Phone Call' LIMIT 1", [org.id]
        )).rows[0];
        const number = await nextNumber(org.id, 'JOB', 'job', client);
        jobId = (await client.query(
          'INSERT INTO jobs (org_id, job_number, customer_id, status, lead_source_id, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
          [org.id, number, customer.id, 'lead', source?.id || null, `Auto-created from inbound call (${from})`]
        )).rows[0].id;
      }

      await client.query(
        'INSERT INTO calls (org_id, call_sid, direction, from_number, to_number, status, customer_id, job_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
        [org.id, callSid, 'inbound', from, to, 'received', customer.id, jobId]
      );
      await client.query(
        'INSERT INTO activities (org_id, job_id, customer_id, type, subject, body) VALUES ($1,$2,$3,$4,$5,$6)',
        [org.id, jobId, customer.id, 'call', `Inbound call from ${from}`, 'Captured automatically. Recording will appear in Calls.']
      );
    });
  } catch (e) {
    console.error('Voice webhook failed:', e);
  }

  res.send(xml(
    `<Say voice="alice">Thank you for calling ${esc(org.name)}. ` +
    `Please leave your name, phone number, and details about your move after the beep.</Say>` +
    `<Record maxLength="180" playBeep="true" recordingStatusCallback="/api/public/voice/${esc(req.params.key)}/recording"/>` +
    `<Say voice="alice">Thank you. We will call you back shortly. Goodbye.</Say>`
  ));
});

// Twilio recording status callback: attach the audio to the call log.
router.post('/voice/:key/recording', async (req, res) => {
  const org = await orgByKey(req.params.key);
  if (org) {
    const sid = req.body?.CallSid || null;
    const url = req.body?.RecordingUrl ? `${req.body.RecordingUrl}.mp3` : null;
    const duration = parseInt(req.body?.RecordingDuration, 10) || null;
    if (sid && url) {
      await q(
        `UPDATE calls SET recording_url = $1, duration_seconds = $2, status = 'recorded'
         WHERE org_id = $3 AND call_sid = $4 RETURNING id`,
        [url, duration, org.id, sid]
      );
    }
  }
  res.type('text/xml').send(xml(''));
});

// ---------------------------------------------------------------------------
// Public review page. The customer opens /review/<token>, rates the move, and
// 4-5 stars are routed to Google while lower ratings are captured privately.
// ---------------------------------------------------------------------------
router.get('/review/:token', async (req, res) => {
  const r = await one(`
    SELECT r.id, r.status, r.rating, o.name AS company_name, o.id AS org_id, c.first_name
    FROM review_requests r JOIN organizations o ON o.id = r.org_id
    LEFT JOIN customers c ON c.id = r.customer_id
    WHERE r.token = $1
  `, [req.params.token]);
  if (!r) return res.status(404).json({ error: 'This review link is not valid.' });
  const gs = await one("SELECT value FROM settings WHERE org_id = $1 AND key = 'review_google_url'", [r.org_id]);
  res.json({
    company_name: r.company_name, first_name: r.first_name,
    already_reviewed: r.status === 'reviewed', rating: r.rating,
    google_review_url: gs?.value || null,
  });
});

router.post('/review/:token', async (req, res) => {
  const r = await one('SELECT * FROM review_requests WHERE token = $1', [req.params.token]);
  if (!r) return res.status(404).json({ error: 'This review link is not valid.' });
  const rating = parseInt(req.body?.rating, 10);
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Please choose a star rating.' });
  const comment = (req.body?.comment || '').toString().slice(0, 2000);
  await run(
    `UPDATE review_requests SET rating = $1, comment = $2, status = 'reviewed', reviewed_at = now() WHERE id = $3`,
    [rating, comment, r.id]
  );
  if (r.customer_id) {
    await run(
      'INSERT INTO activities (org_id, customer_id, job_id, type, subject, body) VALUES ($1,$2,$3,$4,$5,$6)',
      [r.org_id, r.customer_id, r.job_id, 'note', `Customer left a ${rating}-star review`, comment]
    );
  }
  const gs = await one("SELECT value FROM settings WHERE org_id = $1 AND key = 'review_google_url'", [r.org_id]);
  // Encourage happy customers to post publicly on Google.
  res.json({ ok: true, rating, google_review_url: rating >= 4 ? gs?.value || null : null });
});

// ---------------------------------------------------------------------------
// Stripe webhook: keep each org's plan in sync with its subscription.
// ---------------------------------------------------------------------------
router.post('/stripe-webhook', async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) return res.json({ received: true });
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event = req.body;
  try {
    const sig = req.headers['stripe-signature'];
    if (process.env.STRIPE_WEBHOOK_SECRET && sig && req.rawBody) {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
  } catch (e) {
    return res.status(400).json({ error: `Webhook signature failed: ${e.message}` });
  }

  const setPlan = async (orgId, plan, subId, renewsAt) => {
    await run(
      'UPDATE organizations SET plan = $1, stripe_subscription_id = $2, plan_renews_at = $3 WHERE id = $4',
      [plan, subId, renewsAt, orgId]
    );
  };
  try {
    const obj = event.data?.object || {};
    const orgId = parseInt(obj.metadata?.org_id, 10);
    if (event.type === 'checkout.session.completed' && orgId) {
      await setPlan(orgId, obj.metadata?.plan || 'starter', obj.subscription || null, null);
    } else if (event.type === 'customer.subscription.updated' && orgId) {
      const plan = obj.metadata?.plan || 'starter';
      const active = ['active', 'trialing'].includes(obj.status);
      const renews = obj.current_period_end ? new Date(obj.current_period_end * 1000).toISOString() : null;
      await setPlan(orgId, active ? plan : 'trial', obj.id, renews);
    } else if (event.type === 'customer.subscription.deleted' && orgId) {
      await setPlan(orgId, 'trial', null, null);
    }
  } catch (e) {
    console.error('Stripe webhook handling failed:', e);
  }
  res.json({ received: true });
});

export default router;
