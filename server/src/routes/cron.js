// Scheduled email reports. Vercel Cron calls GET /api/cron/reports daily; this
// figures out which companies are due (weekly on Mondays, monthly on the 1st),
// builds a summary, and emails it. Protected by CRON_SECRET (and Vercel's own
// x-vercel-cron header). Email sending is via Resend and is optional.
import { Router } from 'express';
import { q, one } from '../db.js';
import { sendEmail, emailConfigured } from '../email.js';

const router = Router();

const money = (n) => '$' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function buildReport(orgId, periodDays, label) {
  const m = await one(`
    SELECT
      (SELECT COUNT(*) FROM jobs WHERE org_id=$1 AND created_at >= now() - ($2||' days')::interval)::int AS leads,
      (SELECT COUNT(*) FROM jobs WHERE org_id=$1 AND booked_at >= now() - ($2||' days')::interval)::int AS booked,
      (SELECT COALESCE(SUM(estimated_total),0) FROM jobs WHERE org_id=$1 AND booked_at >= now() - ($2||' days')::interval) AS booked_value,
      (SELECT COALESCE(SUM(amount),0) FROM payments WHERE org_id=$1 AND paid_at >= now() - ($2||' days')::interval) AS collected,
      (SELECT COUNT(*) FROM jobs WHERE org_id=$1 AND completed_at >= now() - ($2||' days')::interval)::int AS completed,
      (SELECT ROUND(AVG(rating)::numeric,2) FROM review_requests WHERE org_id=$1 AND reviewed_at >= now() - ($2||' days')::interval) AS avg_rating
  `, [orgId, String(periodDays)]);
  const org = await one('SELECT name FROM organizations WHERE id=$1', [orgId]);
  const row = (k, v) => `<tr><td style="padding:8px 14px;border-bottom:1px solid #eee;color:#555">${k}</td><td style="padding:8px 14px;border-bottom:1px solid #eee;font-weight:700;text-align:right">${v}</td></tr>`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#2563eb">${org.name} — ${label} report</h2>
      <p style="color:#555">Here's how your business performed over the last ${periodDays} days:</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:8px;overflow:hidden">
        ${row('New leads', m.leads)}
        ${row('Jobs booked', m.booked)}
        ${row('Booked value', money(m.booked_value))}
        ${row('Cash collected', money(m.collected))}
        ${row('Moves completed', m.completed)}
        ${row('Average review rating', m.avg_rating ? m.avg_rating + ' ★' : '—')}
      </table>
      <p style="color:#999;font-size:12px;margin-top:18px">Sent automatically by MoveCRM. Change your report schedule in Reports → Email reports.</p>
    </div>`;
  return { subject: `${org.name}: your ${label.toLowerCase()} business report`, html };
}

router.get('/reports', async (req, res) => {
  const secret = process.env.CRON_SECRET;
  const authed = req.headers['x-vercel-cron'] ||
    (secret && (req.query.key === secret || req.headers.authorization === `Bearer ${secret}`));
  if (!authed) return res.status(403).json({ error: 'Forbidden' });

  const now = new Date();
  const dow = now.getUTCDay(); // 0=Sun, 1=Mon
  const dom = now.getUTCDate();
  const force = req.query.force === '1';

  const scheduled = await q(`
    SELECT s.org_id, s.value AS frequency,
      (SELECT value FROM settings WHERE org_id = s.org_id AND key='report_recipients') AS recipients
    FROM settings s WHERE s.key='report_frequency' AND s.value IN ('weekly','monthly')
  `);

  let sent = 0, due = 0, skipped = 0;
  for (const sch of scheduled) {
    const isDue = force || (sch.frequency === 'weekly' && dow === 1) || (sch.frequency === 'monthly' && dom === 1);
    if (!isDue) continue;
    due++;
    let recipients = (sch.recipients || '').split(',').map((e) => e.trim()).filter(Boolean);
    if (!recipients.length) {
      recipients = (await q("SELECT email FROM users WHERE org_id=$1 AND role='admin' AND active=1", [sch.org_id])).map((u) => u.email);
    }
    if (!recipients.length) { skipped++; continue; }
    const { subject, html } = await buildReport(sch.org_id, sch.frequency === 'weekly' ? 7 : 30, sch.frequency === 'weekly' ? 'Weekly' : 'Monthly');
    try {
      const r = await sendEmail({ to: recipients, subject, html });
      if (r.skipped) skipped++; else sent++;
    } catch (e) {
      console.error('Report email failed for org', sch.org_id, e.message);
      skipped++;
    }
  }
  res.json({ ok: true, scheduled: scheduled.length, due, sent, skipped, email_configured: emailConfigured() });
});

export default router;
