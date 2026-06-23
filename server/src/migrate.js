import { pool } from './db.js';
import { ensureSchema } from './schema.js';

ensureSchema(pool)
  .then(() => console.log('Schema is up to date.'))
  .catch((e) => { console.error('Migration failed:', e.message); process.exitCode = 1; })
  .finally(() => pool.end());
