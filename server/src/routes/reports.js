import { Router } from 'express';
import { q, one } from '../db.js';

const router = Router();

router.get('/dashboard', async (req, res) => {
  const org = req.orgId;
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + '-01';

  const newLeads = (await one(
    `SELECT COUNT(*)::int AS n FROM jobs WHERE org_id=$1 AND status IN ('lead','opportunity') AND created_at >= $2`,
    [org, monthStart])).n;
  const booked = await one(
    `SELECT COUNT(*)::int AS n, COALESCE(SUM(estimated_total),0) AS value FROM jobs WHERE org_id=$1 AND booked_at >= $2`,
    [org, monthStart]);
  const movesToday = (await one(
    `SELECT COUNT(*)::int AS n FROM jobs WHERE org_id=$1 AND move_date = $2 AND status IN ('booked','in_progress')`,
    [org, today])).n;
  const collected = (await one(
    `SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE org_id=$1 AND paid_at >= $2`, [org, monthStart])).total;
  const outstanding = (await one(`
    SELECT COALESCE(SUM(i.total - COALESCE(p.paid,0)),0) AS total FROM invoices i
    LEFT JOIN (SELECT invoice_id, SUM(amount) AS paid FROM payments GROUP BY invoice_id) p ON p.invoice_id = i.id
    WHERE i.org_id=$1 AND i.status IN ('sent','partial')`, [org])).total;
  const conv = await one(`
    SELECT
      SUM(CASE WHEN status IN ('booked','in_progress','completed') THEN 1 ELSE 0 END)::int AS won,
      SUM(CASE WHEN status IN ('lost','cancelled') THEN 1 ELSE 0 END)::int AS lost
    FROM jobs WHERE org_id=$1 AND created_at >= now() - interval '90 days'`, [org]);
  const won = conv.won || 0, lost = conv.lost || 0;
  const conversionRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0;

  const upcoming = await q(`
    SELECT j.id, j.job_number, j.move_date, j.arrival_window, j.status, j.estimated_total,
      c.first_name, c.last_name, j.origin_city, j.dest_city, ms.name AS move_size
    FROM jobs j JOIN customers c ON c.id = j.customer_id
    LEFT JOIN move_sizes ms ON ms.id = j.move_size_id
    WHERE j.org_id=$1 AND j.move_date >= $2 AND j.status IN ('booked','in_progress')
    ORDER BY j.move_date LIMIT 8`, [org, today]);

  const recentActivity = await q(`
    SELECT a.*, u.name AS user_name, j.job_number FROM activities a
    LEFT JOIN users u ON u.id = a.user_id LEFT JOIN jobs j ON j.id = a.job_id
    WHERE a.org_id=$1 ORDER BY a.created_at DESC LIMIT 10`, [org]);

  const openTasks = await q(`
    SELECT t.*, u.name AS assignee, j.job_number FROM tasks t
    LEFT JOIN users u ON u.id = t.assigned_to LEFT JOIN jobs j ON j.id = t.job_id
    WHERE t.org_id=$1 AND t.completed = 0 ORDER BY t.due_date NULLS LAST LIMIT 10`, [org]);

  const revenueByMonth = await q(`
    SELECT to_char(paid_at, 'YYYY-MM') AS month, SUM(amount) AS total
    FROM payments WHERE org_id=$1 AND paid_at >= now() - interval '6 months'
    GROUP BY month ORDER BY month`, [org]);

  const pipeline = await q(`
    SELECT status, COUNT(*)::int AS count, COALESCE(SUM(estimated_total),0) AS value
    FROM jobs WHERE org_id=$1 AND status IN ('lead','opportunity','booked','in_progress') GROUP BY status`, [org]);

  res.json({
    kpis: { newLeads, bookedCount: booked.n, bookedValue: booked.value, movesToday, collected, outstanding, conversionRate },
    upcoming, recentActivity, openTasks, revenueByMonth, pipeline,
  });
});

router.get('/sales', async (req, res) => {
  const org = req.orgId;
  const from = req.query.from || new Date(Date.now() - 180 * 864e5).toISOString().slice(0, 10);
  const to = req.query.to || new Date().toISOString().slice(0, 10);

  const bySource = await q(`
    SELECT COALESCE(ls.name, 'Unknown') AS source, COUNT(*)::int AS leads,
      SUM(CASE WHEN j.status IN ('booked','in_progress','completed') THEN 1 ELSE 0 END)::int AS booked,
      COALESCE(SUM(CASE WHEN j.status IN ('booked','in_progress','completed') THEN j.estimated_total ELSE 0 END),0) AS revenue
    FROM jobs j LEFT JOIN lead_sources ls ON ls.id = j.lead_source_id
    WHERE j.org_id=$1 AND j.created_at::date BETWEEN $2 AND $3
    GROUP BY source ORDER BY revenue DESC`, [org, from, to]);

  const bySalesperson = await q(`
    SELECT COALESCE(u.name, 'Unassigned') AS salesperson, COUNT(*)::int AS leads,
      SUM(CASE WHEN j.status IN ('booked','in_progress','completed') THEN 1 ELSE 0 END)::int AS booked,
      COALESCE(SUM(CASE WHEN j.status IN ('booked','in_progress','completed') THEN j.estimated_total ELSE 0 END),0) AS revenue
    FROM jobs j LEFT JOIN users u ON u.id = j.salesperson_id
    WHERE j.org_id=$1 AND j.created_at::date BETWEEN $2 AND $3
    GROUP BY salesperson ORDER BY revenue DESC`, [org, from, to]);

  const byMonth = await q(`
    SELECT to_char(created_at, 'YYYY-MM') AS month, COUNT(*)::int AS leads,
      SUM(CASE WHEN status IN ('booked','in_progress','completed') THEN 1 ELSE 0 END)::int AS booked,
      COALESCE(SUM(CASE WHEN status IN ('booked','in_progress','completed') THEN estimated_total ELSE 0 END),0) AS revenue
    FROM jobs WHERE org_id=$1 AND created_at::date BETWEEN $2 AND $3
    GROUP BY month ORDER BY month`, [org, from, to]);

  const lostReasons = await q(`
    SELECT COALESCE(NULLIF(lost_reason,''), 'No reason given') AS reason, COUNT(*)::int AS count
    FROM jobs WHERE org_id=$1 AND status = 'lost' AND created_at::date BETWEEN $2 AND $3
    GROUP BY reason ORDER BY count DESC`, [org, from, to]);

  const paymentsByMonth = await q(`
    SELECT to_char(paid_at, 'YYYY-MM') AS month, SUM(amount) AS collected
    FROM payments WHERE org_id=$1 AND paid_at::date BETWEEN $2 AND $3
    GROUP BY month ORDER BY month`, [org, from, to]);

  res.json({ from, to, bySource, bySalesperson, byMonth, lostReasons, paymentsByMonth });
});

// Business analytics: this period vs last period, funnel, and breakdowns —
// so a company can compare how the business is trending.
router.get('/analytics', async (req, res) => {
  const org = req.orgId;
  const days = Math.min(parseInt(req.query.days, 10) || 30, 365);

  // One row with current-period and previous-period metrics side by side.
  const compare = await one(`
    WITH cur AS (
      SELECT COUNT(*)::int AS leads,
        SUM(CASE WHEN status IN ('booked','in_progress','completed') THEN 1 ELSE 0 END)::int AS booked,
        COALESCE(SUM(CASE WHEN status IN ('booked','in_progress','completed') THEN estimated_total ELSE 0 END),0) AS booked_value
      FROM jobs WHERE org_id=$1 AND created_at >= now() - ($2 || ' days')::interval
    ), prev AS (
      SELECT COUNT(*)::int AS leads,
        SUM(CASE WHEN status IN ('booked','in_progress','completed') THEN 1 ELSE 0 END)::int AS booked,
        COALESCE(SUM(CASE WHEN status IN ('booked','in_progress','completed') THEN estimated_total ELSE 0 END),0) AS booked_value
      FROM jobs WHERE org_id=$1
        AND created_at >= now() - ($2 || ' days')::interval * 2
        AND created_at < now() - ($2 || ' days')::interval
    ), curpay AS (
      SELECT COALESCE(SUM(amount),0) AS collected FROM payments
      WHERE org_id=$1 AND paid_at >= now() - ($2 || ' days')::interval
    ), prevpay AS (
      SELECT COALESCE(SUM(amount),0) AS collected FROM payments
      WHERE org_id=$1 AND paid_at >= now() - ($2 || ' days')::interval * 2
        AND paid_at < now() - ($2 || ' days')::interval
    )
    SELECT cur.leads, cur.booked, cur.booked_value, curpay.collected,
           prev.leads AS prev_leads, prev.booked AS prev_booked,
           prev.booked_value AS prev_booked_value, prevpay.collected AS prev_collected
    FROM cur, prev, curpay, prevpay
  `, [org, String(days)]);

  const funnel = await one(`
    SELECT COUNT(*)::int AS inquiries,
      SUM(CASE WHEN status != 'lead' THEN 1 ELSE 0 END)::int AS reached_opportunity,
      SUM(CASE WHEN status IN ('booked','in_progress','completed') THEN 1 ELSE 0 END)::int AS booked,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::int AS completed
    FROM jobs WHERE org_id=$1 AND created_at >= now() - ($2 || ' days')::interval
  `, [org, String(days)]);

  const byType = await q(`
    SELECT type, COUNT(*)::int AS jobs,
      COALESCE(SUM(CASE WHEN status IN ('booked','in_progress','completed') THEN estimated_total ELSE 0 END),0) AS revenue,
      COALESCE(AVG(CASE WHEN status IN ('booked','in_progress','completed') THEN estimated_total END),0) AS avg_value
    FROM jobs WHERE org_id=$1 AND created_at >= now() - ($2 || ' days')::interval
    GROUP BY type ORDER BY revenue DESC
  `, [org, String(days)]);

  const busiestDays = await q(`
    SELECT to_char(move_date, 'Day') AS day, COUNT(*)::int AS moves
    FROM jobs WHERE org_id=$1 AND move_date IS NOT NULL
      AND status IN ('booked','in_progress','completed')
      AND created_at >= now() - ($2 || ' days')::interval
    GROUP BY day, extract(dow from move_date) ORDER BY extract(dow from move_date)
  `, [org, String(days)]);

  const topCustomers = await q(`
    SELECT c.id, c.first_name, c.last_name, COUNT(j.id)::int AS jobs,
      COALESCE(SUM(j.estimated_total),0) AS value
    FROM customers c JOIN jobs j ON j.customer_id = c.id
    WHERE c.org_id=$1 AND j.status IN ('booked','in_progress','completed')
    GROUP BY c.id ORDER BY value DESC LIMIT 5
  `, [org]);

  const callStats = await one(`
    SELECT COUNT(*)::int AS total,
      SUM(CASE WHEN recording_url IS NOT NULL THEN 1 ELSE 0 END)::int AS recorded,
      SUM(CASE WHEN created_at >= now() - ($2 || ' days')::interval THEN 1 ELSE 0 END)::int AS in_period
    FROM calls WHERE org_id=$1
  `, [org, String(days)]);

  res.json({ days, compare, funnel, byType, busiestDays, topCustomers, callStats });
});

export default router;
