// SaaS subscription plans. The product is paid (no free tier) — only the
// platform owner gets free access. New companies get a short free trial, then
// choose a plan. Enterprise is sales-assisted ("contact us").
export const TRIAL_DAYS = 14;

export const PLANS = {
  owner: {
    key: 'owner', label: 'Owner', price: 0, free: true, hidden: true,
    websites: Infinity, users: Infinity,
    blurb: 'Unlimited platform-owner access.',
    features: ['Everything, unlimited', 'Free forever'],
  },
  trial: {
    key: 'trial', label: 'Free Trial', price: 0, trial: true, hidden: true,
    websites: 5, users: 25,
    blurb: 'Explore everything free for 14 days.',
    features: ['Full access during your trial'],
  },
  starter: {
    key: 'starter', label: 'Starter', price: 100,
    websites: 1, users: 5,
    blurb: 'For a single moving company website.',
    features: [
      '1 lead-capture website',
      'Up to 5 team members',
      'Full sales pipeline, jobs & dispatch',
      'Estimating, invoicing & payments',
      'Automatic review gathering',
      'Phone & form lead capture',
    ],
  },
  growth: {
    key: 'growth', label: 'Growth', price: 200,
    websites: 5, users: 25,
    blurb: 'For companies running several locations.',
    features: [
      'Up to 5 lead-capture websites',
      'Up to 25 team members',
      'Everything in Starter',
      'Advanced analytics & comparisons',
      'Call recording',
      'Priority email support',
    ],
  },
  pro: {
    key: 'pro', label: 'Pro', price: 400,
    websites: 15, users: 100,
    blurb: 'For large multi-brand operators.',
    features: [
      'Up to 15 lead-capture websites',
      'Up to 100 team members',
      'Everything in Growth',
      'Dedicated onboarding',
      'Phone support',
    ],
  },
  enterprise: {
    key: 'enterprise', label: 'Enterprise', price: null, contact: true,
    websites: Infinity, users: Infinity,
    blurb: 'Unlimited websites & users, custom needs.',
    features: [
      'Unlimited lead-capture websites',
      'Unlimited team members',
      'Everything in Pro',
      'Custom integrations & SLAs',
      'Dedicated account manager',
    ],
  },
};

export const planOf = (key) => PLANS[key] || PLANS.trial;

// Cards shown on the pricing/billing page (purchasable + contact).
export const publicPlans = () =>
  ['starter', 'growth', 'pro', 'enterprise'].map((k) => {
    const p = PLANS[k];
    return {
      key: p.key, label: p.label, price: p.price, contact: !!p.contact,
      websites: p.websites === Infinity ? 'Unlimited' : p.websites,
      users: p.users === Infinity ? 'Unlimited' : p.users,
      blurb: p.blurb, features: p.features,
    };
  });

// Map plan keys to Stripe price IDs (set as env vars when going live).
export const stripePriceFor = (key) =>
  ({
    starter: process.env.STRIPE_PRICE_STARTER,
    growth: process.env.STRIPE_PRICE_GROWTH,
    pro: process.env.STRIPE_PRICE_PRO,
  }[key]);

export const stripeConfigured = () => !!process.env.STRIPE_SECRET_KEY;

// Stripe isn't available in every country (e.g. Pakistan). As an alternative, a
// plain checkout URL per plan can be set — a Payoneer "Request a Payment" link,
// or a Merchant-of-Record buy link (Lemon Squeezy / Paddle) that pays out to
// Payoneer. The "Choose plan" button sends the customer there.
export const checkoutUrlFor = (key) =>
  ({
    starter: process.env.CHECKOUT_URL_STARTER,
    growth: process.env.CHECKOUT_URL_GROWTH,
    pro: process.env.CHECKOUT_URL_PRO,
  }[key] || null);

export const paymentsConfigured = () =>
  stripeConfigured() || !!(process.env.CHECKOUT_URL_STARTER || process.env.CHECKOUT_URL_GROWTH || process.env.CHECKOUT_URL_PRO);
