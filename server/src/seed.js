// Creates a ready-to-explore demo company. Useful for local testing; production
// users instead create their own company through the signup page.
import bcrypt from 'bcryptjs';
import { pool, one, tx } from './db.js';
import { provisionOrg, loadSampleData } from './provision.js';

const DEMO_EMAIL = 'admin@movecrm.test';

async function seed() {
  const existing = await one('SELECT id FROM users WHERE email = $1', [DEMO_EMAIL]);
  if (existing && !process.env.FORCE_SEED) {
    console.log('Demo company already exists. Set FORCE_SEED=1 to recreate it.');
    return;
  }

  if (process.env.FORCE_SEED && existing) {
    const u = await one('SELECT org_id FROM users WHERE email = $1', [DEMO_EMAIL]);
    await pool.query('DELETE FROM organizations WHERE id = $1', [u.org_id]); // cascades
    console.log('Removed existing demo company.');
  }

  await tx(async (client) => {
    const org = (await client.query('INSERT INTO organizations (name) VALUES ($1) RETURNING id', ['Acme Moving Co.'])).rows[0];
    const admin = (await client.query(
      'INSERT INTO users (org_id, name, email, password_hash, role) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [org.id, 'Admin User', DEMO_EMAIL, bcrypt.hashSync('admin123', 10), 'admin']
    )).rows[0];
    await client.query(
      'INSERT INTO users (org_id, name, email, password_hash, role) VALUES ($1,$2,$3,$4,$5)',
      [org.id, 'Sara Sales', 'sara@movecrm.test', bcrypt.hashSync('sales123', 10), 'salesperson']
    );
    await client.query(
      'INSERT INTO users (org_id, name, email, password_hash, role) VALUES ($1,$2,$3,$4,$5)',
      [org.id, 'Dan Dispatch', 'dan@movecrm.test', bcrypt.hashSync('dispatch123', 10), 'dispatcher']
    );
    await provisionOrg(client, org.id, 'Acme Moving Co.');
    await client.query("UPDATE settings SET value=$1 WHERE org_id=$2 AND key='company_phone'", ['(555) 010-2030', org.id])
      .catch(() => {});
    await loadSampleData(client, org.id, admin.id);
  });

  console.log('Demo company seeded.');
  console.log('Logins:');
  console.log('  admin@movecrm.test / admin123    (admin)');
  console.log('  sara@movecrm.test  / sales123    (salesperson)');
  console.log('  dan@movecrm.test   / dispatch123 (dispatcher)');
}

seed()
  .catch((e) => { console.error('Seed failed:', e); process.exitCode = 1; })
  .finally(() => pool.end());
