import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Send, Trash2, Save, Copy } from 'lucide-react';
import { api, fmtDateTime } from '../lib/api.js';
import { Field, Empty } from '../components/ui.jsx';

const Stars = ({ n }) => (
  <span style={{ whiteSpace: 'nowrap' }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} size={14} fill={n >= i ? '#f59e0b' : 'none'} color={n >= i ? '#f59e0b' : '#cbd5e1'} style={{ verticalAlign: -2 }} />
    ))}
  </span>
);

export default function Reviews() {
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState({});
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(null);

  const load = () => {
    api('/reviews').then(setData).catch(console.error);
    api('/reviews/settings').then(setSettings).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const saveSettings = async () => {
    await api('/reviews/settings', { method: 'PUT', body: settings });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const link = (token) => `${window.location.origin}/review/${token}`;
  const copy = (id, token) => {
    navigator.clipboard.writeText(link(token)).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    });
  };
  const remove = async (id) => { await api(`/reviews/${id}`, { method: 'DELETE' }); load(); };

  if (!data) return <div className="empty">Loading…</div>;
  const { requests, stats } = data;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Reviews</h1>
          <div className="sub">Automatically collect 5-star reviews after every completed move</div>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi"><div className="label">Requests sent</div><div className="value">{stats.requested || 0}</div></div>
        <div className="kpi"><div className="label">Reviews collected</div><div className="value">{stats.reviewed || 0}</div></div>
        <div className="kpi"><div className="label">Average rating</div><div className="value">{stats.avg_rating ? `${stats.avg_rating}★` : '—'}</div></div>
        <div className="kpi"><div className="label">4★ and up</div><div className="value">{stats.positive || 0}</div></div>
      </div>

      <div className="grid-3070">
        <div className="card">
          <div className="card-head">Review requests</div>
          {requests.length === 0 ? (
            <Empty>No review requests yet. Complete a job (with auto-request on) or send one from a job’s page.</Empty>
          ) : (
            <table className="data">
              <thead><tr><th>Customer</th><th>Job</th><th>Status</th><th>Rating</th><th>Comment</th><th>When</th><th /></tr></thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>{r.first_name ? `${r.first_name} ${r.last_name}` : '—'}</td>
                    <td>{r.job_id ? <Link to={`/jobs/${r.job_id}`}>{r.job_number}</Link> : '—'}</td>
                    <td>
                      <span className="badge" style={{ background: r.status === 'reviewed' ? '#10b981' : '#0ea5e9' }}>{r.status}</span>
                    </td>
                    <td>{r.rating ? <Stars n={r.rating} /> : '—'}</td>
                    <td className="muted" style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.comment || ''}</td>
                    <td className="muted">{fmtDateTime(r.created_at)}</td>
                    <td>
                      <button className="btn icon sm" title="Copy review link" onClick={() => copy(r.id, r.token)}>
                        {copied === r.id ? '✓' : <Copy size={13} />}
                      </button>{' '}
                      <button className="btn icon sm danger" onClick={() => remove(r.id)}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-head">Review settings</div>
          <div className="card-body">
            <Field label="Your Google review link">
              <input value={settings.review_google_url || ''} onChange={(e) => setSettings((p) => ({ ...p, review_google_url: e.target.value }))}
                placeholder="https://g.page/r/...review" />
            </Field>
            <p className="muted" style={{ fontSize: 12, marginTop: -6 }}>
              Customers who rate 4★ or 5★ are sent here to post publicly. Find it in your Google Business profile → Ask for reviews.
            </p>
            <Field label="Request message">
              <textarea rows={3} value={settings.review_message || ''} onChange={(e) => setSettings((p) => ({ ...p, review_message: e.target.value }))} />
            </Field>
            <label className="row" style={{ cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: 'auto' }}
                checked={settings.review_auto_on_complete === 'true'}
                onChange={(e) => setSettings((p) => ({ ...p, review_auto_on_complete: e.target.checked ? 'true' : 'false' }))} />
              Automatically request a review when a job is completed
            </label>
            <button className="btn primary mt" onClick={saveSettings}><Save size={15} /> {saved ? 'Saved!' : 'Save settings'}</button>
          </div>
        </div>
      </div>
    </>
  );
}
