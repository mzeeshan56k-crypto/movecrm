import { Router } from 'express';
import { one } from '../db.js';
import { requireRole } from '../auth.js';
import { PLANS, publicPlans, planOf, stripePriceFor, stripeConfigured } from '../plans.js';

const router = Router();

async function getStripe() {
  if (!stripeConfigured()) return null;
  const Stripe = (await import('stripe')).default;
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

const appUrl = (req) => process.env.APP_URL || process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
const supportEmail = () => process.env.SUPPORT_EMAIL || process.env.OWNER_EMAIL || 'sales@example.com';

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
  res.json({
    plans: publicPlans(),
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
    billing_enabled: stripeConfigured(),
    support_email: supportEmail(),
  });
});

router.post('/subscribe', requireRole('admin'), async (req, res) => {
  const { plan } = req.body || {};
  if (!PLANS[plan] || PLANS[plan].free || PLANS[plan].contact || PLANS[plan].price == null) {
    return res.status(400).json({ error: 'Choose a paid plan (Starter, Growth or Pro).' });
  }
  const stripe = await getStripe();
  if (!stripe) {
    return res.status(503).json({
      error: 'Billing is not connected yet. The platform owner needs to add Stripe keys before paid plans can be purchased.',
      billing_enabled: false,
    });
  }
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
    mode: 'subscription',
    customer,
    line_items: [{ price, quantity: 1 }],
    success_url: `${appUrl(req)}/billing?upgraded=1`,
    cancel_url: `${appUrl(req)}/billing`,
    metadata: { org_id: String(org.id), plan },
    subscription_data: { metadata: { org_id: String(org.id), plan } },
  });
  res.json({ url: session.url });
});

router.post('/portal', requireRole('admin'), async (req, res) => {
  const stripe = await getStripe();
  if (!stripe) return res.status(503).json({ error: 'Billing is not connected yet.' });
  const org = await one('SELECT stripe_customer_id FROM organizations WHERE id = $1', [req.orgId]);
  if (!org.stripe_customer_id) return res.status(400).json({ error: 'No subscription on file.' });
  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${appUrl(req)}/billing`,
  });
  res.json({ url: session.url });
});

export default router;
