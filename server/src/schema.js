// Multi-tenant schema. All statements are idempotent so this can run on every
// cold start in serverless environments.
import crypto from 'crypto';

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'trial',
  public_key TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_renews_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS public_key TEXT UNIQUE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_renews_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
-- The free tier was removed; existing free accounts become trials.
UPDATE organizations SET plan = 'trial', trial_ends_at = COALESCE(trial_ends_at, now() + interval '14 days') WHERE plan IN ('free', 'trial') AND trial_ends_at IS NULL;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'salesperson',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS counters (
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (org_id, name)
);

CREATE TABLE IF NOT EXISTS settings (
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (org_id, key)
);

CREATE TABLE IF NOT EXISTS lead_sources (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS move_sizes (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cubic_feet INTEGER NOT NULL DEFAULT 0,
  est_hours REAL NOT NULL DEFAULT 0,
  est_movers INTEGER NOT NULL DEFAULT 2
);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rate_type TEXT NOT NULL DEFAULT 'flat',
  rate REAL NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  company TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_number TEXT NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'lead',
  type TEXT NOT NULL DEFAULT 'local',
  move_date DATE,
  arrival_window TEXT,
  move_size_id INTEGER REFERENCES move_sizes(id),
  origin_address TEXT, origin_city TEXT, origin_state TEXT, origin_zip TEXT, origin_floor TEXT,
  dest_address TEXT, dest_city TEXT, dest_state TEXT, dest_zip TEXT, dest_floor TEXT,
  distance_miles REAL,
  lead_source_id INTEGER REFERENCES lead_sources(id),
  salesperson_id INTEGER REFERENCES users(id),
  estimated_total REAL NOT NULL DEFAULT 0,
  crew_notes TEXT,
  notes TEXT,
  lost_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  booked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS estimate_items (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rate_type TEXT NOT NULL DEFAULT 'flat',
  quantity REAL NOT NULL DEFAULT 1,
  rate REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  room TEXT NOT NULL DEFAULT 'General',
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  cubic_feet REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS crew_members (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'mover',
  phone TEXT, email TEXT,
  hourly_wage REAL NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS trucks (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity_cuft INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available'
);

CREATE TABLE IF NOT EXISTS job_crew (
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  crew_member_id INTEGER NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
  PRIMARY KEY (job_id, crew_member_id)
);

CREATE TABLE IF NOT EXISTS job_trucks (
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  truck_id INTEGER NOT NULL REFERENCES trucks(id) ON DELETE CASCADE,
  PRIMARY KEY (job_id, truck_id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft',
  subtotal REAL NOT NULL DEFAULT 0,
  tax_rate REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  method TEXT NOT NULL DEFAULT 'card',
  reference TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  type TEXT NOT NULL DEFAULT 'note',
  subject TEXT,
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  assigned_to INTEGER REFERENCES users(id),
  title TEXT NOT NULL,
  due_date DATE,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT ''
);

-- Lead-capture websites/locations. Each has its own public link & form. The
-- Free plan allows one; paid plans allow more.
CREATE TABLE IF NOT EXISTS websites (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  public_key TEXT UNIQUE NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Automated review gathering: a request is created (often when a job completes),
-- the customer opens a public link, rates the move, and 4-5 star ratings are sent
-- on to Google while lower ratings are captured privately for the company.
CREATE TABLE IF NOT EXISTS review_requests (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  token TEXT UNIQUE NOT NULL,
  channel TEXT NOT NULL DEFAULT 'link',
  status TEXT NOT NULL DEFAULT 'pending',
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS calls (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  call_sid TEXT,
  direction TEXT NOT NULL DEFAULT 'inbound',
  from_number TEXT,
  to_number TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  duration_seconds INTEGER,
  recording_url TEXT,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dedupe ledger for inbound integration leads (WhatConverts, MarketingClarity,
-- etc.) so webhook retries and API re-syncs never create duplicate leads.
CREATE TABLE IF NOT EXISTS integration_leads (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,
  job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_integration_leads_uniq ON integration_leads(org_id, provider, external_id);

CREATE INDEX IF NOT EXISTS idx_jobs_org_status ON jobs(org_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_org_movedate ON jobs(org_id, move_date);
CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(org_id);
CREATE INDEX IF NOT EXISTS idx_activities_job ON activities(job_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_calls_org ON calls(org_id);
CREATE INDEX IF NOT EXISTS idx_websites_org ON websites(org_id);
CREATE INDEX IF NOT EXISTS idx_reviews_org ON review_requests(org_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_org_number ON jobs(org_id, job_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_org_number ON invoices(org_id, invoice_number);
`;

export const newPublicKey = () => crypto.randomBytes(12).toString('hex');

export async function ensureSchema(pool) {
  await pool.query(SCHEMA);
  // Backfill public keys for orgs created before this column existed.
  const missing = await pool.query('SELECT id FROM organizations WHERE public_key IS NULL');
  for (const row of missing.rows) {
    await pool.query('UPDATE organizations SET public_key = $1 WHERE id = $2', [newPublicKey(), row.id]);
  }
  // Ensure every PAID or owner org has a lead-capture website (using its existing
  // key). Trials get none until they purchase — lead-capture websites are a paid
  // product, so this backfill deliberately skips trial orgs. Upgrading to a paid
  // plan provisions the first website automatically on the next request.
  const noSite = await pool.query(`
    SELECT o.id, o.public_key FROM organizations o
    WHERE o.plan <> 'trial'
      AND NOT EXISTS (SELECT 1 FROM websites w WHERE w.org_id = o.id)
  `);
  for (const row of noSite.rows) {
    await pool.query(
      'INSERT INTO websites (org_id, name, public_key) VALUES ($1, $2, $3)',
      [row.id, 'Main Website', row.public_key || newPublicKey()]
    );
  }
}
