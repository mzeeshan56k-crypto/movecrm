import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Phone, Mail, MessageSquare, RefreshCw, FileText, DollarSign, Boxes, CalendarCheck } from 'lucide-react';
import { api, money, fmtDate, fmtDateTime } from '../lib/api.js';
import { StatusBadge, Field, Empty } from '../components/ui.jsx';

const ACT_ICONS = { call: Phone, email: Mail, sms: MessageSquare, status_change: RefreshCw, note: FileText, system: RefreshCw };
const ACT_COLORS = { call: '#22c55e', email: '#2563eb', sms: '#8b5cf6', status_change: '#f59e0b', note: '#64748b', system: '#64748b' };
const WON = ['booked', 'in_progress', 'completed'];

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="kpi kpi-rich">
      <div className="kpi-icon" style={{ background: `${color}1a`, color }}><Icon size={18} /></div>
      <div><div className="label">{label}</div><div className="value" title={String(value)}>{value}</div></div>
    </div>
  );
}

export default function CustomerDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [c, setC] = useState(null);
  const [f, setF] = useState(null);
  const [saved, setSaved] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api(`/customers/${id}`).then((d) => { setC(d); setF(d); }).catch(console.error);
  }, [id]);

  if (!c || !f) {
    return (
      <>
        <div className="page-head"><div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 14, width: 80, marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 26, width: 240 }} />
        </div></div>
        <div className="kpi-grid">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton skeleton-kpi" />)}</div>
        <div className="grid-3070"><div className="skeleton" style={{ height: 240 }} /><div className="skeleton" style={{ height: 300 }} /></div>
      </>
    );
  }

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const save = async () => {
    const updated = await api(`/customers/${id}`, {
      method: 'PUT',
      body: { first_name: f.first_name, last_name: f.last_name, email: f.email, phone: f.phone, company: f.company, address: f.address, notes: f.notes },
    });
    setC({ ...c, ...updated });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const newJob = async () => {
    setCreating(true);
    try {
      const job = await api('/jobs', { method: 'POST', body: { customer_id: Number(id) } });
      nav(`/jobs/${job.id}`);
    } catch (e) { alert(e.message); setCreating(false); }
  };

  const wonJobs = c.jobs.filter((j) => WON.includes(j.status));
  const lifetimeValue = wonJobs.reduce((s, j) => s + (j.estimated_total || 0), 0);
  const lastMove = c.jobs.map((j) => j.move_date).filter(Boolean).sort().slice(-1)[0];

  return (
    <>
      <div className="page-head">
        <div>
          <button className="btn sm" onClick={() => nav(-1)} style={{ marginBottom: 6 }}><ArrowLeft size={14} /> Back</button>
          <h1>{c.first_name} {c.last_name}{c.company && <span className="muted" style={{ fontSize: 16, fontWeight: 400 }}> · {c.company}</span>}</h1>
          <div className="sub">Customer since {fmtDate(c.created_at)}</div>
        </div>
        <button className="btn primary" onClick={newJob} disabled={creating}><Plus size={16} /> {creating ? 'Creating…' : 'New job for this customer'}</button>
      </div>

      <div className="kpi-grid">
        <Stat icon={DollarSign} label="Lifetime value" value={money(lifetimeValue)} color="#10b981" />
        <Stat icon={Boxes} label="Total jobs" value={c.jobs.length} color="#6366f1" />
        <Stat icon={CalendarCheck} label="Won / booked" value={wonJobs.length} color="#22c55e" />
        <Stat icon={CalendarCheck} label="Last move" value={lastMove ? fmtDate(lastMove) : '—'} color="#0ea5e9" />
      </div>

      <div className="grid-3070">
        <div>
          <div className="card">
            <div className="card-head">Jobs</div>
            {c.jobs.length === 0 ? <Empty>No jobs yet — click “New job for this customer” above.</Empty> : (
              <table className="data">
                <thead><tr><th>Job #</th><th>Status</th><th>Move date</th><th>Size</th><th>Estimate</th></tr></thead>
                <tbody>
                  {c.jobs.map((j) => (
                    <tr key={j.id} className="clickable" onClick={() => nav(`/jobs/${j.id}`)}>
                      <td><b>{j.job_number}</b></td>
                      <td><StatusBadge status={j.status} /></td>
                      <td>{fmtDate(j.move_date)}</td>
                      <td>{j.move_size || '—'}</td>
                      <td><b>{money(j.estimated_total)}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card mt">
            <div className="card-head">Activity history</div>
            <div className="card-body">
              {c.activities.length === 0 ? <span className="muted">No activity recorded.</span> : c.activities.map((a) => {
                const Icon = ACT_ICONS[a.type] || FileText;
                const col = ACT_COLORS[a.type] || '#64748b';
                return (
                  <div className="activity-item" key={a.id}>
                    <div className="activity-icon" style={{ background: `${col}1a`, color: col }}><Icon size={14} /></div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{a.subject || a.type}</div>
                      {a.body && <div className="muted" style={{ whiteSpace: 'pre-wrap' }}>{a.body}</div>}
                      <div className="muted" style={{ fontSize: 12 }}>{a.user_name || 'System'} · {fmtDateTime(a.created_at)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            Contact details
            <div className="row" style={{ gap: 8 }}>
              {f.phone && <a className="btn icon sm" href={`tel:${f.phone}`} title="Call"><Phone size={14} /></a>}
              {f.email && <a className="btn icon sm" href={`mailto:${f.email}`} title="Email"><Mail size={14} /></a>}
            </div>
          </div>
          <div className="card-body">
            <Field label="First name"><input value={f.first_name || ''} onChange={set('first_name')} /></Field>
            <Field label="Last name"><input value={f.last_name || ''} onChange={set('last_name')} /></Field>
            <Field label="Email"><input value={f.email || ''} onChange={set('email')} /></Field>
            <Field label="Phone"><input value={f.phone || ''} onChange={set('phone')} /></Field>
            <Field label="Company"><input value={f.company || ''} onChange={set('company')} /></Field>
            <Field label="Address"><input value={f.address || ''} onChange={set('address')} /></Field>
            <Field label="Notes"><textarea rows={3} value={f.notes || ''} onChange={set('notes')} /></Field>
            <button className="btn primary" onClick={save}><Save size={15} /> {saved ? 'Saved!' : 'Save'}</button>
          </div>
        </div>
      </div>
    </>
  );
}
