import { nextNumber } from './db.js';

// Default configuration every new company starts with.
const DEFAULT_SETTINGS = {
  default_tax_rate: '8.25',
  review_message: 'Thanks for choosing us! How did your move go? Tap to leave a quick review.',
  review_auto_on_complete: 'true',
};
const LEAD_SOURCES = ['Google Ads', 'Website Form', 'Referral', 'Yelp', 'Phone Call', 'Repeat Customer'];
const MOVE_SIZES = [
  ['Studio', 400, 3, 2], ['1 Bedroom Apt', 600, 4, 2], ['2 Bedroom Apt', 900, 5, 3],
  ['3 Bedroom House', 1500, 7, 3], ['4 Bedroom House', 2200, 9, 4], ['Office (small)', 1200, 6, 3],
];
const SERVICES = [
  ['Moving labor (per hour, per crew)', 'hourly', 159],
  ['Travel fee', 'flat', 120],
  ['Packing service (per hour)', 'hourly', 89],
  ['Packing materials (per box)', 'per_unit', 4.5],
  ['Piano handling', 'flat', 250],
  ['Storage (per month)', 'flat', 199],
  ['Long distance (per mile)', 'per_unit', 4.25],
];
const TEMPLATES = [
  ['Quote follow-up', 'Your moving quote from {{company_name}}',
    'Hi {{first_name}},\n\nThanks for requesting a quote! Your estimated total is {{estimated_total}} for your move on {{move_date}}.\n\nReply or call us at {{company_phone}} to book your date — spots fill up fast!\n\n— {{salesperson}}'],
  ['Booking confirmation', 'You are booked! Move confirmation {{job_number}}',
    'Hi {{first_name}},\n\nYour move is confirmed for {{move_date}} (arrival window {{arrival_window}}).\n\nOrigin: {{origin_address}}\nDestination: {{dest_address}}\n\nSee you soon!\n{{company_name}}'],
  ['Payment reminder', 'Invoice {{invoice_number}} — balance due',
    'Hi {{first_name}},\n\nA friendly reminder that your invoice {{invoice_number}} has an outstanding balance.\n\nThank you!\n{{company_name}}'],
];

// Seeds default config for a brand-new organization. Runs inside a transaction.
export async function provisionOrg(client, orgId, companyName) {
  const settings = { company_name: companyName, ...DEFAULT_SETTINGS };
  for (const [k, v] of Object.entries(settings)) {
    await client.query('INSERT INTO settings (org_id, key, value) VALUES ($1,$2,$3)', [orgId, k, v]);
  }
  for (const name of LEAD_SOURCES) {
    await client.query('INSERT INTO lead_sources (org_id, name) VALUES ($1,$2)', [orgId, name]);
  }
  for (const [name, cf, hrs, movers] of MOVE_SIZES) {
    await client.query('INSERT INTO move_sizes (org_id, name, cubic_feet, est_hours, est_movers) VALUES ($1,$2,$3,$4,$5)', [orgId, name, cf, hrs, movers]);
  }
  for (const [name, type, rate] of SERVICES) {
    await client.query('INSERT INTO services (org_id, name, rate_type, rate) VALUES ($1,$2,$3,$4)', [orgId, name, type, rate]);
  }
  for (const [name, subject, body] of TEMPLATES) {
    await client.query('INSERT INTO email_templates (org_id, name, subject, body) VALUES ($1,$2,$3,$4)', [orgId, name, subject, body]);
  }
}
