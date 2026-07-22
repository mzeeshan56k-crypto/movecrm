import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { pool } from './db.js';
import { ensureSchema } from './schema.js';
import { requireAuth } from './auth.js';
import authRoutes from './routes/auth.js';
import accountRoutes from './routes/account.js';
import customerRoutes from './routes/customers.js';
import jobRoutes from './routes/jobs.js';
import resourceRoutes from './routes/resources.js';
import billingRoutes from './routes/billing.js';
import reportRoutes from './routes/reports.js';
import settingsRoutes from './routes/settings.js';
import publicRoutes from './routes/public.js';
import callRoutes from './routes/calls.js';
import websiteRoutes from './routes/websites.js';
import reviewRoutes from './routes/reviews.js';
import subscriptionRoutes from './routes/subscription.js';
import cronRoutes from './routes/cron.js';
import importRoutes from './routes/imports.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const app = express();

app.use(cors());

// Baseline security headers on every response. We intentionally do NOT set
// X-Frame-Options here because the public lead-capture form is meant to be
// embedded in customers' own sites (framing is allowed via CSP frame-ancestors).
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  next();
});

// Capture the raw body so the Stripe webhook can verify its signature.
app.use(express.json({ limit: '2mb', verify: (req, _res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: false })); // Twilio + plain HTML forms post form-encoded

// Create tables on first request (no-op afterwards). This lets serverless
// deploys work with zero manual migration steps.
let schemaReady = null;
app.use((req, res, next) => {
  if (!schemaReady) schemaReady = ensureSchema(pool);
  schemaReady.then(() => next()).catch(next);
});

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false, error: 'database unavailable' });
  }
});

app.use('/api/public', publicRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/account', requireAuth, accountRoutes);
app.use('/api/customers', requireAuth, customerRoutes);
app.use('/api/jobs', requireAuth, jobRoutes);
app.use('/api/resources', requireAuth, resourceRoutes);
app.use('/api/billing', requireAuth, billingRoutes);
app.use('/api/reports', requireAuth, reportRoutes);
app.use('/api/settings', requireAuth, settingsRoutes);
app.use('/api/calls', requireAuth, callRoutes);
app.use('/api/websites', requireAuth, websiteRoutes);
app.use('/api/reviews', requireAuth, reviewRoutes);
app.use('/api/subscription', requireAuth, subscriptionRoutes);
app.use('/api/import', requireAuth, importRoutes);

// Serve the built frontend when it exists (local/production single-server mode).
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});
