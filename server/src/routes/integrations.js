import { Router } from 'express';
import { q, one, tx } from '../db.js';
import { requireRole } from '../auth.js';
import { fetchWhatConvertsLeads, ingestLead } from '../integrations.js';

const router = Router();

const getSetting = async (orgId, key) =>
  (await one('SELECT value FROM settings WHERE org_id = $1 AND key = $2', [orgId, key]))?.value || null;

const setSetting = async (orgId, key, value) => {
  await one(
    `INSERT INTO settings (org_id, key, value) VALUES ($1, $2, $3)
     ON CONFLICT (org_id, key) DO UPDATE SET value = EXCLUDED.value RETURNING org_id`,
    [orgId, key, value == null ? '' : String(value)]
  );
};

const baseUrl = (req) =>
  (process.env.PUBLIC_BASE_URL || process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

// Integration status + the webhook URLs to paste into each provider. Secrets are
// never returned — only whether they are configured.
router.get('/', async (req, res) => {
  const org = await one('SELECT public_key, plan FROM organizations WHERE id = $1', [req.orgId]);
  const key = org?.public_key;
  const base = baseUrl(req);
  const token = await getSetting(req.orgId, 'wc_api_token');
  const secret = await getSetting(req.orgId, 'wc_api_secret');
  res.json({
    locked: org?.plan === 'trial',
    public_key: key,
    webhooks: {
      whatconverts: `${base}/api/public/whatconverts/${key}`,
      marketingclarity: `${base}/api/public/marketingclarity/${key}`,
      generic: `${base}/api/public/lead/${key}`,
    },
    whatconverts: {
      api_connected: !!(token && secret),
      profile_id: await getSetting(req.orgId, 'wc_profile_id'),
      last_sync: await getSetting(req.orgId, 'wc_last_sync'),
    },
  });
});

// Save (or update) WhatConverts API credentials for pull-based sync.
router.put('/whatconverts', requireRole('admin'), async (req, res) => {
  const { api_token, api_secret, profile_id } = req.body || {};
  if (!api_token || !api_secret) return res.status(400).json({ error: 'API token and secret are required.' });
  await setSetting(req.orgId, 'wc_api_token', String(api_token).trim());
  await setSetting(req.orgId, 'wc_api_secret', String(api_secret).trim());
  await setSetting(req.orgId, 'wc_profile_id', String(profile_id || '').trim());
  res.json({ ok: true });
});

router.delete('/whatconverts', requireRole('admin'), async (req, res) => {
  await q("DELETE FROM settings WHERE org_id = $1 AND key IN ('wc_api_token','wc_api_secret','wc_profile_id','wc_last_sync')", [req.orgId]);
  res.json({ ok: true });
});

// Pull recent leads from the WhatConverts API and ingest any new ones now.
router.post('/whatconverts/sync', requireRole('admin'), async (req, res) => {
  const org = await one('SELECT id, name, plan FROM organizations WHERE id = $1', [req.orgId]);
  if (org.plan === 'trial') return res.status(402).json({ error: 'Lead integrations require a paid plan.' });
  const token = await getSetting(req.orgId, 'wc_api_token');
  const secret = await getSetting(req.orgId, 'wc_api_secret');
  if (!token || !secret) return res.status(400).json({ error: 'Connect your WhatConverts API token and secret first.' });
  const profileId = await getSetting(req.orgId, 'wc_profile_id');
  try {
    const leads = await fetchWhatConvertsLeads({ token, secret, profileId });
    let added = 0, skipped = 0;
    for (const lead of leads) {
      const r = await tx((client) => ingestLead(client, org, 'whatconverts', lead));
      if (r.duplicate) skipped++; else added++;
    }
    await setSetting(req.orgId, 'wc_last_sync', new Date().toISOString());
    res.json({ ok: true, fetched: leads.length, added, skipped });
  } catch (e) {
    console.error('WhatConverts sync failed:', e);
    res.status(e.status || 500).json({ error: e.message || 'Sync failed.' });
  }
});

export default router;
