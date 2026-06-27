import { Router } from 'express';
import { q, one } from '../db.js';
import { requireRole } from '../auth.js';
import { PLANS, publicPlans, planOf, stripePriceFor, stripeConfigured, checkoutUrlFor, paymentsConfigured } from '../plans.js';

const router = Router();

async function getStripe() {
  if (!stripeConfigured()) return null;
  const Stripe = (await import('stripe')).default;
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

const appUrl = (req) => process.env.APP_URL || process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
const supportEmail = () => process.env.SUPPORT_EMAIL || process.env.OWNER_EMAIL || 'sales@example.com';

const requireOwner = async (req, res, next) => {
  const org = await one('SELECT plan FROM organizations WHERE id = $1', [req.orgId]);
  if (org?.plan !== 'owner') return res.status(403).json({ error: 'Owner access only' });
  next();
};

// Plans + this org's current plan, trial status and usage.
router.get('/', async (req, res) => {
  const org = await one('SELECT name, plan, plan_renews_at, trial_ends_at FROM organizations WHERE id = $1', [req.orgId]);
  const websites = (await one('SELECT COUNT(*)::int AS n FROM websites WHERE org_id = $1', [req.orgId])).n;
  const users = (await one('SELECT COUNT(*)::int AS n FROM users WHERE org_id = $1', [req.orgId])).n;
  const current = planOf(org.plan);
  let trialDaysLeft = null;
  if (org.plan === 'trial' && org.trial_ends_at) {
    trialDaysLeft = Math.max(0, Math.ceil((new Date(org.trial_ends_at) - Date.now()) / 864e5));
  }
  // Attach a checkout URL to each plan card when one is configured.
  const plans = publicPlans().map((p) => ({ ...p, checkout_url: p.contact ? null : checkoutUrlFor(p.key) }));
  res.json({
    plans,
    current: {
      key: org.plan,
      label: current.label,
      renews_at: org.plan_renews_at,
      trial_ends_at: org.trial_ends_at,
      trial_days_left: trialDaysLeft,
      websites_limit: current.websites === Infinity ? 'Unlimited' : current.websites,
      users_limit: current.users === Infinity ? 'Unlimited' : current.users,
    },
    usage: { websites, users },
    payments_enabled: paymentsConfigured(),
    stripe_enabled: stripeConfigured(),
    is_owner: org.plan === 'owner',
    support_email: supportEmail(),
  });
});

router.post('/subscribe', requireRole('admin'), async (req, res) => {
  const { plan } = req.body || {};
  if (!PLANS[plan] || PLANS[plan].free || PLANS[plan].contact || PLANS[plan].price == null) {
    return res.status(400).json({ error: 'Choose a paid plan (Starter, Growth or Pro).' });
  }

  // 1) Stripe checkout if configured.
  const stripe = await getStripe();
  if (stripe) {
    const price = stripePriceFor(plan);
    if (!price) return res.status(503).json({ error: `No Stripe price configured for the ${plan} plan.` });
    const org = await one('SELECT id, name, stripe_customer_id FROM organizations WHERE id = $1', [req.orgId]);
    let customer = org.stripe_customer_id;
    if (!customer) {
      const c = await stripe.customers.create({ name: org.name, email: req.user.email, metadata: { org_id: String(org.id) } });
      customer = c.id;
      await one('UPDATE organizations SET stripe_customer_id = $1 WHERE id = $2 RETURNING id', [customer, org.id]);
    }
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription', customer, line_items: [{ price, quantity: 1 }],
      success_url: `${appUrl(req)}/billing?upgraded=1`, cancel_url: `${appUrl(req)}/billing`,
      metadata: { org_id: String(org.id), plan }, subscription_data: { metadata: { org_id: String(org.id), plan } },
    });
    return res.json({ url: session.url, external: false });
  }

  // 2) Fallback: a configured checkout link (Payoneer / Lemon Squeezy / Paddle).
  const link = checkoutUrlFor(plan);
  if (link) return res.json({ url: link, external: true });

  return res.status(503).json({
    error: 'Online payment is not connected yet. Please contact us to activate your plan.',
    payments_enabled: false,
  });
});

router.post('/portal', requireRole('admin'), async (req, res) => {
  const stripe = await getStripe();
  if (!stripe) return res.status(503).json({ error: 'The billing portal is only available with Stripe. Contact us to change your plan.' });
  const org = await one('SELECT stripe_customer_id FROM organizations WHERE id = $1', [req.orgId]);
  if (!org.stripe_customer_id) return res.status(400).json({ error: 'No subscription on file.' });
  const session = await stripe.billingPortal.sessions.create({ customer: org.stripe_customer_id, return_url: `${appUrl(req)}/billing` });
  res.json({ url: session.url });
});

// --- Owner admin: manage every company's plan (for manual activation after a
// Payoneer/MoR payment). Visible only to the platform owner. ---
router.get('/orgs', requireOwner, async (req, res) => {
  const orgs = await q(`
    SELECT o.id, o.name, o.plan, o.created_at, o.trial_ends_at,
      (SELECT email FROM users WHERE org_id = o.id AND role='admin' ORDER BY id LIMIT 1) AS admin_email,
      (SELECT COUNT(*)::int FROM websites WHERE org_id = o.id) AS websites,
      (SELECT COUNT(*)::int FROM users WHERE org_id = o.id) AS users
    FROM organizations o ORDER BY o.created_at DESC LIMIT 500
  `);
  res.json(orgs);
});

router.post('/orgs/:id/plan', requireOwner, async (req, res) => {
  const { plan } = req.body || {};
  if (!PLANS[plan]) return res.status(400).json({ error: 'Unknown plan' });
  const renews = ['starter', 'growth', 'pro'].includes(plan)
    ? new Date(Date.now() + 30 * 864e5).toISOString() : null;
  const row = await one(
    'UPDATE organizations SET plan = $1, plan_renews_at = $2 WHERE id = $3 RETURNING id, name, plan',
    [plan, renews, req.params.id]
  );
  if (!row) return res.status(404).json({ error: 'Company not found' });
  res.json(row);
});

export default router;
