import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Phone, Mail, MessageSquare, RefreshCw, FileText, CheckCircle2, Circle, X } from 'lucide-react';
import { api, money, fmtDate, fmtDateTime, STATUS_META } from '../lib/api.js';
import { StatusBadge, Empty } from '../components/ui.jsx';
import NewLeadModal from '../components/NewLeadModal.jsx';

const ACT_ICONS = { call: Phone, email: Mail, sms: MessageSquare, status_change: RefreshCw, note: FileText, system: RefreshCw };

function Onboarding({ onNewLead }) {
  const [ob, setOb] = useState(null);
  const nav = useNavigate();
  useEffect(() => { api('/account/onboarding').then(setOb).catch(() => {}); }, []);
  if (!ob || ob.dismissed || ob.complete) return null;

  const dismiss = () => { api('/account/onboarding/dismiss', { method: 'POST' }).catch(() => {}); setOb({ ...ob, dismissed: true }); };
  const done = ob.steps.filter((s) => s.done).length;

  return (
    <div className="card" style={{ marginBottom: 20, borderColor: 'var(--primary)' }}>
      <div className="card-head">
        <span>🚀 Getting started — {done} of {ob.steps.length} done</span>
        <button className="btn icon sm" title="Dismiss" onClick={dismiss}><X size={14} /></button>
      </div>
      <div className="card-body" style={{ paddingTop: 8 }}>
        <div style={{ height: 6, background: '#eef2f7', borderRadius: 4, marginBottom: 14 }}>
          <div style={{ width: `${(done / ob.steps.length) * 100}%`, height: '100%', background: 'var(--primary)', borderRadius: 4, transition: 'width .3s' }} />
        </div>
        {ob.steps.map((s) => (
          <div key={s.key} className="row spread" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
              {s.done ? <CheckCircle2 size={20} color="#22c55e" style={{ flexShrink: 0 }} /> : <Circle size={20} color="#cbd5e1" style={{ flexShrink: 0 }} />}
              <div>
                <div style={{ fontWeight: 600, textDecoration: s.done ? 'line-through' : 'none', color: s.done ? 'var(--muted)' : 'inherit' }}>{s.label}</div>
                <div className="muted" style={{ fontSize: 12 }}>{s.hint}</div>
              </div>
            </div>
            {!s.done && (
              <button className="btn sm" onClick={() => (s.key === 'lead' ? onNewLead() : nav(s.to))}>{s.cta}</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const nav = useNavigate();

  const load = () => {
    api('/reports/dashboard').then(setData).catch(console.error);
  };
  useEffect(() => { load(); }, []);

  if (!data) return <div className="empty">Loading dashboard…</div>;
  const { kpis, upcoming, recentActivity, openTasks, revenueByMonth, pipeline } = data;
  const maxRev = Math.max(...revenueByMonth.map((r) => r.total), 1);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <div className="sub">Your moving business at a glance</div>
        </div>
        <button className="btn primary" onClick={() => setShowNew(true)}><Plus size={16} /> New Lead</button>
      </div>

      <Onboarding onNewLead={() => setShowNew(true)} />

      <div className="kpi-grid">
        <div className="kpi"><div className="label">New leads (month)</div><div className="value">{kpis.newLeads}</div></div>
        <div className="kpi"><div className="label">Booked (month)</div><div className="value">{kpis.bookedCount}</div><div className="hint">{money(kpis.bookedValue)} value</div></div>
        <div className="kpi"><div className="label">Moves today</div><div className="value">{kpis.movesToday}</div></div>
        <div className="kpi"><div className="label">Collected (month)</div><div className="value">{money(kpis.collected)}</div></div>
        <div className="kpi"><div className="label">Outstanding</div><div className="value">{money(kpis.outstanding)}</div></div>
        <div className="kpi"><div className="label">Conversion (90d)</div><div className="value">{kpis.conversionRate}%</div></div>
      </div>

      <div className="grid-3070">
        <div>
          <div className="card">
            <div className="card-head">Upcoming moves</div>
            {upcoming.length === 0 ? <Empty>No upcoming moves scheduled.</Empty> : (
              <table className="data">
                <thead><tr><th>Date</th><th>Job</th><th>Customer</th><th>Route</th><th>Status</th><th>Est.</th></tr></thead>
                <tbody>
                  {upcoming.map((j) => (
                    <tr key={j.id} className="clickable" onClick={() => nav(`/jobs/${j.id}`)}>
                      <td>{fmtDate(j.move_date)}<div className="muted" style={{ fontSize: 12 }}>{j.arrival_window}</div></td>
                      <td>{j.job_number}</td>
                      <td>{j.first_name} {j.last_name}</td>
                      <td className="muted">{j.origin_city} → {j.dest_city}</td>
                      <td><StatusBadge status={j.status} /></td>
                      <td>{money(j.estimated_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card mt">
            <div className="card-head">Revenue collected — last 6 months</div>
            <div className="card-body">
              {revenueByMonth.length === 0 ? <Empty>No payments recorded yet.</Empty> : (
                <div className="bar-chart">
                  {revenueByMonth.map((r) => (
                    <div className="bar-wrap" key={r.month}>
                      <div className="bar-value">{money(r.total)}</div>
                      <div className="bar" style={{ height: `${Math.max((r.total / maxRev) * 100, 2)}%` }} />
                      <div className="bar-label">{r.month.slice(5)}/{r.month.slice(2, 4)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-head">Pipeline</div>
            <div className="card-body">
              {pipeline.map((p) => (
                <div className="row spread" key={p.status} style={{ padding: '7px 0' }}>
                  <StatusBadge status={p.status} />
                  <div><b>{p.count}</b> <span className="muted">· {money(p.value)}</span></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card mt">
            <div className="card-head">Open tasks</div>
            <div className="card-body">
              {openTasks.length === 0 ? <span className="muted">All caught up 🎉</span> : openTasks.map((t) => (
                <div key={t.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600 }}>{t.title}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {t.due_date ? `Due ${fmtDate(t.due_date)}` : 'No due date'}{t.job_number ? ` · ${t.job_number}` : ''}{t.assignee ? ` · ${t.assignee}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card mt">
            <div className="card-head">Recent activity</div>
            <div className="card-body">
              {recentActivity.map((a) => {
                const Icon = ACT_ICONS[a.type] || FileText;
                return (
                  <div className="activity-item" key={a.id}>
                    <div className="activity-icon"><Icon size={14} /></div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{a.subject || a.type}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {a.user_name || 'System'}{a.job_number ? ` · ${a.job_number}` : ''} · {fmtDateTime(a.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showNew && (
        <NewLeadModal onClose={() => setShowNew(false)} onCreated={(job) => nav(`/jobs/${job.id}`)} />
      )}
    </>
  );
}
