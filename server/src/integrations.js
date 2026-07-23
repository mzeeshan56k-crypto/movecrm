// Inbound lead integrations (WhatConverts, MarketingClarity, and generic
// providers). Every provider payload is normalized into one shape and passed to
// ingestLead(), which dedupes, creates/reuses the customer, opens a lead, tags
// the marketing source, and logs a call when the lead came from a phone call.
// This is the same pattern SmartMoving uses: a lead-tracking platform pushes a
// webhook (or we pull its API) and each tracked call/form becomes a CRM lead.
import { nextNumber } from './db.js';

const s = (v) => (v == null ? '' : String(v)).trim();
const splitName = (full) => {
  const parts = s(full).split(/\s+/).filter(Boolean);
  if (!parts.length) return { first: '', last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
};
const num = (v) => {
  const n = parseFloat(String(v ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : null;
};

// Normalizes a WhatConverts lead (webhook payload or API object) into our shape.
export function mapWhatConverts(b = {}) {
  const name = s(b.contact_name || b.name);
  const { first, last } = splitName(name);
  const phone = s(b.phone_number || b.caller_number || b.contact_phone || b.phone);
  const email = s(b.email_address || b.contact_email || b.email);
  const type = s(b.lead_type || b.type).toLowerCase();
  const isCall = type.includes('phone') || type.includes('call');
  const parts = [b.lead_source, b.lead_medium, b.lead_campaign].map(s).filter(Boolean);
  const source = parts.length ? `WhatConverts: ${parts.join(' / ')}` : 'WhatConverts';
  const msgBits = [
    b.message && `Message: ${s(b.message)}`,
    b.lead_keyword && `Keyword: ${s(b.lead_keyword)}`,
    b.spotted_keywords && `Keywords: ${s(b.spotted_keywords)}`,
    b.tracking_number && `Tracking #: ${s(b.tracking_number)}`,
    b.landing_url && `Landing: ${s(b.landing_url)}`,
  ].filter(Boolean);
  return {
    external_id: s(b.lead_id || b.id) || null,
    first_name: first || (isCall ? 'Caller' : ''),
    last_name: last,
    phone, email,
    source,
    is_call: isCall,
    quote_value: num(b.quote_value ?? b.sales_value),
    message: msgBits.join('\n'),
    call: isCall ? {
      from: phone || s(b.caller_number),
      to: s(b.destination_number || b.tracking_number) || null,
      duration: num(b.call_duration_seconds),
      recording: s(b.call_recording || b.recording_url) || null,
      sid: s(b.lead_id || b.call_id) || null,
    } : null,
  };
}

// MarketingClarity (and any generic provider) — best-effort mapping across the
// common field names lead platforms use, so it works without bespoke docs.
export function mapGeneric(b = {}, defaultSource = 'MarketingClarity') {
  const name = s(b.contact_name || b.name || b.full_name);
  const sp = splitName(name);
  const first = s(b.first_name) || sp.first;
  const last = s(b.last_name) || sp.last;
  const phone = s(b.phone_number || b.phone || b.caller_number || b.mobile);
  const email = s(b.email_address || b.email);
  const src = s(b.source || b.lead_source || b.utm_source);
  return {
    external_id: s(b.id || b.lead_id || b.external_id) || null,
    first_name: first,
    last_name: last,
    phone, email,
    source: src ? `${defaultSource}: ${src}` : defaultSource,
    is_call: false,
    quote_value: num(b.quote_value ?? b.value),
    message: s(b.message || b.notes || b.comments),
    call: null,
  };
}

// Creates a lead from a normalized payload inside an existing transaction.
// Returns { jobNumber, duplicate }. Dedupes on (org, provider, external_id).
export async function ingestLead(client, org, provider, lead) {
  if (!lead.first_name && !lead.phone && !lead.email) {
    const e = new Error('Lead must include a name, phone or email');
    e.status = 400;
    throw e;
  }

  if (lead.external_id) {
    const dup = (await client.query(
      'SELECT j.job_number FROM integration_leads il LEFT JOIN jobs j ON j.id = il.job_id WHERE il.org_id = $1 AND il.provider = $2 AND il.external_id = $3',
      [org.id, provider, lead.external_id]
    )).rows[0];
    if (dup) return { jobNumber: dup.job_number || null, duplicate: true };
  }

  // Tag (or create) the marketing source so reporting attributes it correctly.
  const source = (await client.query(
    'SELECT id FROM lead_sources WHERE org_id = $1 AND name ILIKE $2 LIMIT 1', [org.id, lead.source]
  )).rows[0] || (await client.query(
    'INSERT INTO lead_sources (org_id, name) VALUES ($1, $2) RETURNING id', [org.id, lead.source]
  )).rows[0];

  // Reuse an existing customer matched by phone or email; otherwise create one.
  let customer = null;
  if (lead.phone || lead.email) {
    customer = (await client.query(
      `SELECT id FROM customers WHERE org_id = $1 AND (
         ($2 <> '' AND phone = $2) OR ($3 <> '' AND email = $3)
       ) LIMIT 1`,
      [org.id, lead.phone || '', lead.email || '']
    )).rows[0] || null;
  }
  if (!customer) {
    customer = (await client.query(
      'INSERT INTO customers (org_id, first_name, last_name, email, phone) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [org.id, lead.first_name || 'Lead', lead.last_name || '', lead.email || null, lead.phone || null]
    )).rows[0];
  }

  const number = await nextNumber(org.id, 'JOB', 'job', client);
  const job = (await client.query(
    `INSERT INTO jobs (org_id, job_number, customer_id, status, type, lead_source_id, estimated_total, notes)
     VALUES ($1,$2,$3,'lead','local',$4,$5,$6) RETURNING id`,
    [org.id, number, customer.id, source.id, lead.quote_value || 0, lead.message || null]
  )).rows[0];

  await client.query(
    'INSERT INTO activities (org_id, job_id, customer_id, type, subject, body) VALUES ($1,$2,$3,$4,$5,$6)',
    [org.id, job.id, customer.id, lead.is_call ? 'call' : 'system', `New lead via ${lead.source}`, lead.message || '']
  );

  if (lead.is_call && lead.call) {
    await client.query(
      'INSERT INTO calls (org_id, call_sid, direction, from_number, to_number, status, duration_seconds, recording_url, customer_id, job_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
      [org.id, lead.call.sid, 'inbound', lead.call.from || null, lead.call.to, lead.call.recording ? 'recorded' : 'received', lead.call.duration, lead.call.recording, customer.id, job.id]
    );
  }

  if (lead.external_id) {
    await client.query(
      'INSERT INTO integration_leads (org_id, provider, external_id, job_id) VALUES ($1,$2,$3,$4) ON CONFLICT (org_id, provider, external_id) DO NOTHING',
      [org.id, provider, lead.external_id, job.id]
    );
  }

  return { jobNumber: number, duplicate: false };
}

// Pulls recent leads from the WhatConverts API (HTTP Basic: token as user,
// secret as password). Returns an array of normalized leads, newest first.
export async function fetchWhatConvertsLeads({ token, secret, profileId, pageSize = 50 }) {
  const auth = Buffer.from(`${token}:${secret}`).toString('base64');
  const params = new URLSearchParams({ leads_per_page: String(pageSize), order: 'date_desc' });
  if (profileId) params.set('profile_id', String(profileId));
  const res = await fetch(`https://app.whatconverts.com/api/v1/leads?${params.toString()}`, {
    headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const e = new Error(`WhatConverts API error ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}`);
    e.status = res.status === 401 ? 401 : 502;
    throw e;
  }
  const data = await res.json().catch(() => ({}));
  const leads = Array.isArray(data.leads) ? data.leads : [];
  return leads.map(mapWhatConverts);
}
