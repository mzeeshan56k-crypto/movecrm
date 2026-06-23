const TOKEN_KEY = 'movecrm_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    clearToken();
    if (!path.startsWith('/auth')) window.location.href = '/login';
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const money = (n) =>
  (Number(n) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export const fmtDate = (s) => {
  if (!s) return '—';
  const d = new Date(s.includes('T') || s.includes(' ') ? s.replace(' ', 'T') + (s.includes('Z') ? '' : 'Z') : s + 'T12:00:00');
  if (isNaN(d)) return s;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const fmtDateTime = (s) => {
  if (!s) return '—';
  const d = new Date(s.replace(' ', 'T') + (s.includes('Z') ? '' : 'Z'));
  if (isNaN(d)) return s;
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export const STATUS_META = {
  lead: { label: 'Lead', color: '#6366f1' },
  opportunity: { label: 'Opportunity', color: '#0ea5e9' },
  booked: { label: 'Booked', color: '#22c55e' },
  in_progress: { label: 'In Progress', color: '#f59e0b' },
  completed: { label: 'Completed', color: '#10b981' },
  lost: { label: 'Lost', color: '#ef4444' },
  cancelled: { label: 'Cancelled', color: '#9ca3af' },
};

export const JOB_TYPES = {
  local: 'Local',
  long_distance: 'Long Distance',
  commercial: 'Commercial',
  storage: 'Storage',
  labor_only: 'Labor Only',
};
