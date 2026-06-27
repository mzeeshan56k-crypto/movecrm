import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Send, Trash2, Save, Copy, MessageSquare, TrendingUp } from 'lucide-react';
import { api, fmtDateTime } from '../lib/api.js';
import { useLive } from '../lib/useLive.js';
import { Field, Empty } from '../components/ui.jsx';

const Stars = ({ n, size = 14 }) => (
  <span style={{ whiteSpace: 'nowrap' }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} size={size} fill={n >= i ? '#f59e0b' : 'none'} color={n >= i ? '#f59e0b' : '#cbd5e1'} style={{ verticalAlign: -2 }} />
    ))}
  </span>
);

const FILTERS = [{ k: 'all', label: 'All' }, { k: 'reviewed', label: 'Collected' }, { k: 'pending', label: 'Awaiting' }];

export default function Reviews() {
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState({});
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(null);
  const [filter, setFilter] = useState('all');
  const reqId = useRef(0);

  const load = () => {
    const id = ++reqId.current;
    api('/reviews').then((d) => { if (id === reqId.current) setData(d); }).catch(console.error);
    api('/reviews/settings').then(setSettings).catch(() => {});
  };
  useEffect(() => { load(); }, []);
  useLive(load, []);

  const saveSettings = async () => {
    await api('/reviews/settings', { method: 'PUT', body: settings });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };
  const link = (token) => `${window.location.origin}/review/${token}`;
  const copy = (id, token) => {
    navigator.clipboard.writeText(link(token)).then(() => { setCopied(id); setTimeout(() => setCopied(null), 1500); });
  };
  const remove = async (id) => { if (!window.confirm('Delete this review request?')) return; await api(`/reviews/${id}`, { method: 'DELETE' }); load(); };

  if (!data) {
    return (
      <>
        <div className="page-head"><div><h1>Reviews</h1><div className="sub">Loading…</div></div></div>
        <div className="kpi-grid">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton skeleton-kpi" />)}</div>
        <div className="skeleton" style={{ height: 320 }} />
      </>
    );
  }

  const { requests, stats } = data;
  const responseRate = stats.requested ? Math.round((stats.reviewed / stats.requested) * 100) : 0;
  const dist = [5, 4, 3, 2, 1].map((s) => ({ s, n: requests.filter((r) => r.rating === s).length }));
  const maxDist = Math.max(...dist.map((d) => d.n), 1);
  const shown = filter === 'all' ? requests
    : filter === 'reviewed' ? requests.filter((r) => r.status === 'reviewed')
    : requests.filter((r) => r.status !== 'reviewed');

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Reviews</h1>
          <div className="sub">Automatically collect 5-star reviews after every completed move</div>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi kpi-rich"><div className="kpi-icon" style={{ background: '#6366f11a', color: '#6366f1' }}><Send size={18} /></div><div><div className="label">Requests sent</div><div className="value">{stats.requested || 0}</div></div></div>
        <div className="kpi kpi-rich"><div className="kpi-icon" style={{ background: '#10b9811a', color: '#10b981' }}><MessageSquare size={18} /></div><div><div className="label">Reviews collected</div><div className="value">{stats.reviewed || 0}</div></div></div>
        <div className="kpi kpi-rich"><div className="kpi-icon" style={{ background: '#0ea5e91a', color: '#0ea5e9' }}><TrendingUp size={18} /></div><div><div className="label">Response rate</div><div className="value">{responseRate}%</div></div></div>
        <div className="kpi kpi-rich"><div className="kpi-icon" style={{ background: '#f59e0b1a', color: '#f59e0b' }}><Star size={18} /></div><div><div className="label">Average rating</div><div className="value">{stats.avg_rating ? `${stats.avg_rating}★` : '—'}</div></div></div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">Rating distribution</div>
          <div className="card-body">
            {stats.reviewed ? dist.map((d) => (
              <div key={d.s} className="row" style={{ gap: 10, padding: '5px 0' }}>
                <span style={{ width: 54, flexShrink: 0 }}><Stars n={d.s} size={12} /></span>
                <div style={{ flex: 1, background: '#eef2f7', borderRadius: 5, height: 14 }}>
                  <div style={{ width: `${(d.n / maxDist) * 100}%`, height: '100%', background: '#f59e0b', borderRadius: 5, minWidth: d.n ? 3 : 0 }} />
                </div>
                <b style={{ width: 24, textAlign: 'right' }}>{d.n}</b>
              </div>
            )) : <Empty>No reviews collected yet.</Empty>}
          </div>
        </div>

        <div className="card">
          <div className="card-head">Review settings</div>
          <div className="card-body">
            <Field label="Your Google review link">
              <input value={settings.review_google_url || ''} onChange={(e) => setSettings((p) => ({ ...p, review_google_url: e.target.value }))} placeholder="https://g.page/r/...review" />
            </Field>
            <p className="muted" style={{ fontSize: 12, marginTop: -6 }}>
              Customers who rate 4★ or 5★ are sent here to post publicly. Find it in your Google Business profile → Ask for reviews.
            </p>
            <label className="row" style={{ cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={settings.review_auto_on_complete === 'true'}
                onChange={(e) => setSettings((p) => ({ ...p, review_auto_on_complete: e.target.checked ? 'true' : 'false' }))} />
              Automatically request a review when a job is completed
            </label>
            <button className="btn primary mt" onClick={saveSettings}><Save size={15} /> {saved ? 'Saved!' : 'Save settings'}</button>
          </div>
        </div>
      </div>

      <div className="card mt">
        <div className="card-head">
          <div className="seg">{FILTERS.map((ff) => <button key={ff.k} className={filter === ff.k ? 'on' : ''} onClick={() => setFilter(ff.k)}>{ff.label}</button>)}</div>
          <span className="muted" style={{ fontSize: 13 }}>{shown.length} review request{shown.length === 1 ? '' : 's'}</span>
        </div>
        {shown.length === 0 ? (
          <Empty>{requests.length === 0 ? 'No review requests yet. Complete a job (with auto-request on) or send one from a job’s page.' : `No ${filter} requests.`}</Empty>
        ) : (
          <table className="data">
            <thead><tr><th>Customer</th><th>Job</th><th>Status</th><th>Rating</th><th>Comment</th><th>When</th><th /></tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id}>
                  <td>{r.first_name ? `${r.first_name} ${r.last_name}` : '—'}</td>
                  <td>{r.job_id ? <Link to={`/jobs/${r.job_id}`}>{r.job_number}</Link> : '—'}</td>
                  <td><span className="badge" style={{ background: r.status === 'reviewed' ? '#10b981' : '#0ea5e9' }}>{r.status === 'reviewed' ? 'Reviewed' : 'Awaiting'}</span></td>
                  <td>{r.rating ? <Stars n={r.rating} /> : '—'}</td>
                  <td className="muted" style={{ maxWidth: 240, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.comment || ''}>{r.comment || ''}</td>
                  <td className="muted">{fmtDateTime(r.created_at)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn icon sm" title="Copy review link" onClick={() => copy(r.id, r.token)}>{copied === r.id ? '✓' : <Copy size={13} />}</button>{' '}
                    <button className="btn icon sm danger" title="Delete" onClick={() => remove(r.id)}><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
