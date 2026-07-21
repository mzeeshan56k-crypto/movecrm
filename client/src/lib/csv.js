// Tiny dependency-free CSV parser. Handles quoted fields, escaped quotes ("")
// and both \n and \r\n line endings — enough for exports from SmartMoving,
// Excel/Google Sheets and other moving CRMs.
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const src = text.replace(/^﻿/, ''); // strip BOM
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  if (rows.length === 0) return { headers: [], records: [] };
  const headers = rows[0].map((h) => h.trim());
  const records = rows.slice(1)
    .filter((r) => r.some((v) => v && v.trim() !== ''))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()])));
  return { headers, records };
}

// Our importer's target fields, with the source-column header patterns we try
// to auto-detect. SmartMoving's export headers are covered explicitly.
export const IMPORT_FIELDS = [
  { key: 'first_name', label: 'First name', patterns: [/^first.?name$/i, /^first$/i, /^customer.?first/i] },
  { key: 'last_name', label: 'Last name', patterns: [/^last.?name$/i, /^last$/i, /^surname$/i, /^customer.?last/i] },
  { key: 'name', label: 'Full name', patterns: [/^name$/i, /^full.?name$/i, /^customer.?name$/i, /^contact.?name$/i, /^client$/i] },
  { key: 'email', label: 'Email', patterns: [/e-?mail/i] },
  { key: 'phone', label: 'Phone', patterns: [/phone/i, /mobile/i, /cell/i, /^tel/i] },
  { key: 'company', label: 'Company', patterns: [/^company/i, /^business/i, /^organization/i] },
  { key: 'address', label: 'Address', patterns: [/^address$/i, /street/i, /^origin.?address/i] },
  { key: 'status', label: 'Status / Stage', patterns: [/^status$/i, /^stage$/i, /^opportunity.?status/i, /^lead.?status/i] },
  { key: 'type', label: 'Move type', patterns: [/^type$/i, /^move.?type$/i, /^service.?type$/i, /^job.?type$/i] },
  { key: 'move_date', label: 'Move date', patterns: [/move.?date/i, /^date$/i, /service.?date/i, /^start.?date/i] },
  { key: 'move_size', label: 'Move size', patterns: [/move.?size/i, /^size$/i, /bedrooms?/i] },
  { key: 'origin_city', label: 'Origin city', patterns: [/origin.?city/i, /from.?city/i, /^origin$/i, /pickup.?city/i] },
  { key: 'origin_state', label: 'Origin state', patterns: [/origin.?state/i, /from.?state/i] },
  { key: 'origin_zip', label: 'Origin ZIP', patterns: [/origin.?zip/i, /origin.?postal/i] },
  { key: 'dest_city', label: 'Destination city', patterns: [/dest.*city/i, /to.?city/i, /^destination$/i, /dropoff.?city/i, /delivery.?city/i] },
  { key: 'dest_state', label: 'Destination state', patterns: [/dest.*state/i, /to.?state/i] },
  { key: 'dest_zip', label: 'Destination ZIP', patterns: [/dest.*zip/i, /dest.*postal/i] },
  { key: 'estimated_total', label: 'Estimated total ($)', patterns: [/estimate/i, /quote.?total/i, /^total$/i, /^amount$/i, /^value$/i, /price/i] },
  { key: 'notes', label: 'Notes', patterns: [/^notes?$/i, /^comment/i, /description/i] },
];

// Given the file's headers, guess a { fieldKey: header } mapping.
export function autoMap(headers) {
  const mapping = {};
  const used = new Set();
  for (const field of IMPORT_FIELDS) {
    const hit = headers.find((h) => !used.has(h) && field.patterns.some((p) => p.test(h.trim())));
    if (hit) { mapping[field.key] = hit; used.add(hit); }
  }
  return mapping;
}

// Turn raw CSV records into clean objects using the chosen column mapping.
export function applyMapping(records, mapping) {
  return records.map((rec) => {
    const out = {};
    for (const [field, header] of Object.entries(mapping)) {
      if (header && rec[header] !== undefined) out[field] = rec[header];
    }
    return out;
  });
}

// A ready-to-use sample matching what we expect — offered as a download so a
// user can see the format or build one by hand.
export const SAMPLE_CSV =
  'First Name,Last Name,Email,Phone,Move Date,Move Size,Origin City,Destination City,Status,Estimated Total,Notes\n' +
  'Jane,Doe,jane@example.com,(555) 123-4567,08/15/2026,2 Bedroom Apt,Austin,Dallas,booked,2450,Imported from SmartMoving\n' +
  'Mark,Lee,mark@example.com,(555) 987-6543,09/02/2026,3 Bedroom House,Houston,San Antonio,lead,3900,Called twice\n';
