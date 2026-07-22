import { Router } from 'express';
import { q, one, tx } from '../db.js';
import { requireRole } from '../auth.js';
import { seedDemoData } from '../seed.js';

const router = Router();

// Quick workspace status used by the dashboard. Includes a stable public base
// URL (if PUBLIC_BASE_URL/APP_URL is set) so embed links never point at a
// protected preview deployment.
router.get('/status', async (req, res) => {
  const org = await one('SELECT name, plan, public_key, created_at FROM organizations WHERE id = $1', [req.orgId]);
  const jobs = await one('SELECT COUNT(*)::int AS n FROM jobs WHERE org_id = $1', [req.orgId]);
  const publicBaseUrl = process.env.PUBLIC_BASE_URL || process.env.APP_URL || null;
  res.json({ organization: org, jobCount: jobs.n, public_base_url: publicBaseUrl });
});

// Getting-started checklist. Each step is detected from the company's real data,
// so it ticks itself off as they set things up.
router.get('/onboarding', async (req, res) => {
  const settings = Object.fromEntries(
    (await q('SELECT key, value FROM settings WHERE org_id = $1', [req.orgId])).map((r) => [r.key, r.value])
  );
  const counts = await one(`
    SELECT
      (SELECT COUNT(*) FROM jobs WHERE org_id = $1)::int AS jobs,
      (SELECT COUNT(*) FROM jobs j JOIN lead_sources ls ON ls.id = j.lead_source_id
        WHERE j.org_id = $1 AND ls.name ILIKE '%website%')::int AS form_leads,
      (SELECT COUNT(*) FROM users WHERE org_id = $1)::int AS users,
      (SELECT COUNT(*) FROM crew_members WHERE org_id = $1)::int AS crew
  `, [req.orgId]);

  const steps = [
    { key: 'company', label: 'Add your company details', hint: 'Phone, address & tax rate so quotes and invoices look professional.',
      done: !!(settings.company_phone || settings.company_address), to: '/settings', cta: 'Open company settings' },
    { key: 'crew', label: 'Add your crew & trucks', hint: 'So you can assign teams on the dispatch board.',
      done: counts.crew > 0, to: '/settings', cta: 'Add crew' },
    { key: 'lead', label: 'Create your first lead', hint: 'Start your sales pipeline — or let your online form do it for you.',
      done: counts.jobs > 0, to: '/pipeline', cta: 'New lead' },
    { key: 'form', label: 'Share your online quote form', hint: 'Put your form link on your website so inquiries arrive automatically.',
      done: counts.form_leads > 0, to: '/settings', cta: 'Get my form link' },
    { key: 'review', label: 'Turn on review collection', hint: 'Add your Google link to gather 5-star reviews after every move.',
      done: !!settings.review_google_url, to: '/reviews', cta: 'Set up reviews' },
    { key: 'team', label: 'Invite your team', hint: 'Add salespeople and dispatchers with their own logins.',
      done: counts.users > 1, to: '/settings', cta: 'Add a team member' },
  ];
  res.json({ steps, complete: steps.every((s) => s.done), dismissed: settings.onboarding_dismissed === 'true' });
});

router.post('/onboarding/dismiss', async (req, res) => {
  await one(
    `INSERT INTO settings (org_id, key, value) VALUES ($1, 'onboarding_dismissed', 'true')
     ON CONFLICT (org_id, key) DO UPDATE SET value = 'true' RETURNING org_id`,
    [req.orgId]
  );
  res.json({ ok: true });
});

// Wipe all operational data for this company (customers, jobs, invoices, calls,
// reviews, tasks, activities) while keeping settings, pricing, crew, trucks,
// team and websites. Lets an owner clear test data before going live.
router.post('/reset', requireRole('admin'), async (req, res) => {
  try {
    await tx(async (client) => {
      await client.query('DELETE FROM review_requests WHERE org_id = $1', [req.orgId]);
      await client.query('DELETE FROM calls WHERE org_id = $1', [req.orgId]);
      await client.query('DELETE FROM tasks WHERE org_id = $1', [req.orgId]);
      await client.query('DELETE FROM activities WHERE org_id = $1', [req.orgId]);
      // Deleting customers cascades to jobs, estimates, inventory, invoices & payments.
      await client.query('DELETE FROM customers WHERE org_id = $1', [req.orgId]);
      // Restart JOB/INV numbering at 1001.
      await client.query('DELETE FROM counters WHERE org_id = $1', [req.orgId]);
    });
    res.json({ ok: true });
  } catch (e) {
    console.error('Reset failed:', e);
    res.status(500).json({ error: 'Could not reset workspace.' });
  }
});

// Load a full set of realistic demo data (customers, a pipeline across every
// stage, dispatch assignments, invoices/payments, reviews, tasks and calls) so
// the product can be shown to prospective clients. Admin-only. Refuses if the
// workspace already has customer data, to avoid piling demo data onto real data
// (use "Reset workspace" first).
router.post('/seed-demo', requireRole('admin'), async (req, res) => {
  try {
    const existing = await one('SELECT COUNT(*)::int AS n FROM customers WHERE org_id = $1', [req.orgId]);
    if (existing.n > 0 && !req.body?.force) {
      return res.status(409).json({ error: 'This workspace already has data. Reset the workspace first, then load demo data.' });
    }
    const result = await tx((client) => seedDemoData(client, req.orgId, req.user.id));
    res.status(201).json({ ok: true, ...result });
  } catch (e) {
    console.error('Seed demo failed:', e);
    res.status(500).json({ error: 'Could not load demo data. Please try again.' });
  }
});

export default router;
