import pg from 'pg';

// Return DATE columns (OID 1082) as plain 'YYYY-MM-DD' strings instead of Date
// objects, so calendar/day comparisons stay timezone-safe on the frontend.
pg.types.setTypeParser(1082, (v) => v);
// Return numeric/REAL aggregates as numbers, not strings.
pg.types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)));

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/movecrm';

// Managed Postgres (Supabase, Neon, Render) requires SSL; local does not.
const needsSsl =
  /\brender\.com\b|supabase\.co|supabase\.com|neon\.tech|sslmode=require/.test(connectionString) ||
  process.env.PGSSL === 'true';

export const pool = new pg.Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
  // Serverless platforms run many tiny instances — keep one connection each.
  max: process.env.VERCEL ? 1 : 10,
});

// Query helpers ------------------------------------------------------------
export async function q(text, params = []) {
  const res = await pool.query(text, params);
  return res.rows;
}

export async function one(text, params = []) {
  const res = await pool.query(text, params);
  return res.rows[0] || null;
}

export async function run(text, params = []) {
  await pool.query(text, params);
}

export async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// Per-organization, human-friendly sequence numbers (JOB-1001, INV-1001 …)
export async function nextNumber(orgId, prefix, name, client = pool) {
  const res = await client.query(
    `INSERT INTO counters (org_id, name, value) VALUES ($1, $2, 1)
     ON CONFLICT (org_id, name) DO UPDATE SET value = counters.value + 1
     RETURNING value`,
    [orgId, name]
  );
  return `${prefix}-${1000 + res.rows[0].value}`;
}

export async function logActivity({ org_id, job_id = null, customer_id = null, user_id = null, type = 'system', subject = '', body = '' }) {
  await run(
    `INSERT INTO activities (org_id, job_id, customer_id, user_id, type, subject, body)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [org_id, job_id, customer_id, user_id, type, subject, body]
  );
}
