import { one } from './db.js';
import { planOf } from './plans.js';

export async function orgPlan(orgId) {
  const org = await one('SELECT plan FROM organizations WHERE id = $1', [orgId]);
  return planOf(org?.plan);
}

// Throws a 402-style error when an org tries to exceed its plan allowance.
export async function assertWithinLimit(orgId, resource) {
  const plan = await orgPlan(orgId);
  const table = resource === 'websites' ? 'websites' : 'users';
  const cap = plan[resource];
  if (cap === Infinity) return;
  const used = (await one(`SELECT COUNT(*)::int AS n FROM ${table} WHERE org_id = $1`, [orgId])).n;
  if (used >= cap) {
    const e = new Error(
      `Your ${plan.label} plan allows ${cap} ${resource === 'websites' ? 'lead-capture website' : 'team member'}${cap === 1 ? '' : 's'}. Upgrade to add more.`
    );
    e.status = 402;
    e.upgrade = true;
    throw e;
  }
}
