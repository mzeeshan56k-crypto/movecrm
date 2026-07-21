import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Phone, Mail, MessageSquare, RefreshCw, FileText, CheckCircle2, Circle, X,
  UserPlus, CalendarCheck, Truck, DollarSign, Clock, TrendingUp, Rocket, RotateCw,
  ArrowUpRight, ArrowDownRight, Kanban, CalendarDays, Upload,
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Area, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { api, money, fmtDate, fmtDateTime, STATUS_META } from '../lib/api.js';
import { useLive } from '../lib/useLive.js';
import { useAuth } from '../lib/auth.jsx';
import { StatusBadge, Empty } from '../components/ui.jsx';
import NewLeadModal from '../components/NewLeadModal.jsx';

const ACT_ICONS = { call: Phone, email: Mail, sms: MessageSquare, status_change: RefreshCw, note: FileText, system: RefreshCw };
const ACT_COLORS = { call: '#22c55e', email: '#2563eb', sms: '#8b5cf6', status_change: '#f59e0b', note: '#64748b', system: '#64748b' };

// Uniform compact currency for chart axes ($0, $1.2k, $3M) — no precision flips.
const moneyFmt = new Intl.NumberFormat('en-US', { notation: 'compact', style: 'currency', currency: 'USD', maximumFractionDigits: 1 });
const compactMoney = (n) => moneyFmt.format(Number(n) || 0);
// KPI headline currency: no cents, so big numbers fit the narrow cards.
const money0Fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const money0 = (n) => money0Fmt.format(Number(n) || 0);

function relativeTime(ts) {
  if (!ts) return '';
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function LiveDot({ lastUpdated }) {
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 15000); return () => clearInterval(t); }, []);
  return (
    <span className="row muted" style={{ gap: 6, fontSize: 12 }} title="This dashboard updates automatically">
      <span className="live-dot" /> Live · updated {relativeTime(lastUpdated)}
    </span>
  );
}

function Onboarding({ onNewLead, refreshSignal }) {
  const [ob, setOb] = useState(null);
  const nav = useNavigate();
  useEffect(() => { api('/account/onboarding').then(setOb).catch(() => {}); }, [refreshSignal]);
  if (!ob || ob.dismissed || ob.complete) return null;
  const dismiss = () => { api('/account/onboarding/dismiss', { method: 'POST' }).catch(() => {}); setOb({ ...ob, dismissed: true }); };
  const done = ob.steps.filter((s) => s.done).length;
  return (
    <div className="card" style={{ marginBottom: 20, background: '#eff6ff', borderLeft: '3px solid var(--primary)' }}>
      <div className="card-head" style={{ background: 'transparent' }}>
        <span className="row" style={{ gap: 8 }}><Rocket size={16} color="var(--primary)" /> Getting started — {done} of {ob.steps.length} done</span>
        <button className="btn icon sm" title="Dismiss" aria-label="Dismiss getting started" onClick={dismiss}><X size={14} /></button>
      </div>
      <div className="card-body" style={{ paddingTop: 8 }}>
        <div style={{ height: 6, background: 'var(--border)', borderRadius: 4, marginBottom: 14 }}>
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
            {!s.done && <button className="btn sm" onClick={() => (s.key === 'lead' ? onNewLead() : nav(s.to))}>{s.cta}</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function Kpi({ icon: Icon, label, value, hint, color, onClick }) {
  return (
    <div className={`kpi kpi-rich${onClick ? ' kpi-link' : ''}`} onClick={onClick} style={{ '--kpi-accent': color }}>
      <div className="kpi-icon" style={{ background: `${color}1a`, color }}><Icon size={20} /></div>
      <div>
        <div className="label">{label}</div>
        <div className="value" title={String(value)}>{value}</div>
        {hint && <div className="hint">{hint}</div>}
      </div>
    </div>
  );
}

function ChartTip({ active, payload, label, currencyKeys = [] }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', boxShadow: 'var(--shadow)', fontSize: 13 }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: <b>{currencyKeys.includes(p.dataKey) ? money(p.value) : p.value}</b></div>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="page-head"><div><h1>Dashboard</h1><div className="sub">Your moving business at a glance</div></div></div>
      <div className="kpi-grid">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton skeleton-kpi" />)}</div>
      <div className="grid-3070"><div className="skeleton skeleton-chart" /><div className="skeleton skeleton-chart" /></div>
    </>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [obSignal, setObSignal] = useState(0);
  const fromOnboarding = useRef(false);
  const reqId = useRef(0);
  const nav = useNavigate();
  const { user } = useAuth();

  const load = () => {
    const id = ++reqId.current;
    return api('/reports/dashboard')
      .then((d) => { if (id === reqId.current) { setData(d); setError(null); setLastUpdated(Date.now()); } })
      .catch((e) => { if (id === reqId.current) { console.error(e); setError(e); } });
  };
  useEffect(() => { load(); }, []);
  useLive(load, []);

  if (!data) {
    if (error) {
      return (
        <div className="empty">
          <p>We couldn’t load your dashboard.</p>
          <button className="btn primary" onClick={() => { setError(null); load(); }}><RotateCw size={15} /> Retry</button>
        </div>
      );
    }
    return <DashboardSkeleton />;
  }

  const { kpis = {}, upcoming = [], recentActivity = [], openTasks = [], pipeline = [], monthlyTrend = [] } = data;
  const pieData = pipeline.map((p) => ({ name: STATUS_META[p.status]?.label || p.status, value: p.count, color: STATUS_META[p.status]?.color || '#94a3b8' }));
  const hasPipeline = pieData.some((d) => d.value > 0);

  const onLeadCreated = (job) => {
    if (fromOnboarding.current) {
      setShowNew(false);
      fromOnboarding.current = false;
      load();
      setObSignal((n) => n + 1); // re-check onboarding so "first lead" ticks
    } else {
      nav(`/jobs/${job.id}`);
    }
  };

  const firstName = (user?.name || '').split(' ')[0];

  return (
    <>
      <div className="dash-hero">
        <div className="dash-hero-glow" />
        <div className="dash-hero-inner">
          <div>
            <h1>{greeting()}{firstName ? `, ${firstName}` : ''} 👋</h1>
            <div className="dash-hero-sub row" style={{ gap: 12 }}>Here's how your moving business is doing today <LiveDot lastUpdated={lastUpdated} /></div>
          </div>
          <div className="row dash-hero-actions">
            <button className="btn ghost-light" onClick={() => nav('/pipeline')}><Kanban size={16} /> Pipeline</button>
            <button className="btn ghost-light" onClick={() => nav('/calendar')}><CalendarDays size={16} /> Calendar</button>
            <button className="btn hero-cta" onClick={() => { fromOnboarding.current = false; setShowNew(true); }}><Plus size={16} /> New Lead</button>
          </div>
        </div>
      </div>

      <Onboarding refreshSignal={obSignal} onNewLead={() => { fromOnboarding.current = true; setShowNew(true); }} />

      <div className="kpi-grid">
        <Kpi icon={UserPlus} label="New leads (month)" value={kpis.newLeads ?? 0} color="#6366f1" onClick={() => nav('/pipeline')} />
        <Kpi icon={CalendarCheck} label="Booked (month)" value={kpis.bookedCount ?? 0} hint={`${money0(kpis.bookedValue)} value`} color="#22c55e" onClick={() => nav('/jobs')} />
        <Kpi icon={Truck} label="Moves today" value={kpis.movesToday ?? 0} color="#f59e0b" onClick={() => nav('/dispatch')} />
        <Kpi icon={DollarSign} label="Collected (month)" value={money0(kpis.collected)} color="#10b981" onClick={() => nav('/invoices')} />
        <Kpi icon={Clock} label="Outstanding" value={money0(kpis.outstanding)} color="#ef4444" onClick={() => nav('/invoices')} />
        <Kpi icon={TrendingUp} label="Conversion (90d)" value={`${kpis.conversionRate ?? 0}%`} color="#0ea5e9" onClick={() => nav('/reports')} />
      </div>

      <div className="grid-3070 dash-charts">
        <div className="card">
          <div className="card-head">Leads, bookings & revenue — last 6 months</div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={monthlyTrend} margin={{ top: 10, right: 8, left: -6, bottom: 0 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="bookedBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="l" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis yAxisId="r" orientation="right" tickFormatter={compactMoney} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTip currencyKeys={['revenue']} />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} verticalAlign="top" align="right" />
                <Bar yAxisId="l" dataKey="leads" name="Leads" fill="#c7d2fe" radius={[4, 4, 0, 0]} barSize={18} />
                <Bar yAxisId="l" dataKey="booked" name="Booked" fill="url(#bookedBar)" radius={[4, 4, 0, 0]} barSize={18} />
                <Area yAxisId="r" type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#10b981" strokeWidth={3} fill="url(#revFill)" dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-head">Pipeline breakdown</div>
          <div className="card-body">
            {!hasPipeline ? <Empty>No active pipeline yet.</Empty> : (
              <>
                <div className="pie-wrap">
                  <ResponsiveContainer width="100%" height={210}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
                        {pieData.map((d) => <Cell key={d.name} fill={d.color} />)}
                      </Pie>
                      <Tooltip content={<ChartTip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  {pipeline.filter((p) => p.count > 0).map((p) => (
                    <div className="row spread" key={p.status} style={{ padding: '5px 0' }}>
                      <StatusBadge status={p.status} />
                      <div><b>{p.count}</b> <span className="muted">· {money(p.value)}</span></div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid-3070 mt">
        <div className="card">
          <div className="card-head">Upcoming moves</div>
          {upcoming.length === 0 ? <Empty>No upcoming moves scheduled.</Empty> : (
            <table className="data">
              <thead><tr><th>Date</th><th>Job</th><th>Customer</th><th>Route</th><th>Status</th><th>Est.</th></tr></thead>
              <tbody>
                {upcoming.map((j) => (
                  <tr key={j.id} className="clickable" onClick={() => nav(`/jobs/${j.id}`)}>
                    <td>{fmtDate(j.move_date)}{j.arrival_window && <div className="muted" style={{ fontSize: 12 }}>{j.arrival_window}</div>}</td>
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

        <div>
          <div className="card">
            <div className="card-head">Open tasks</div>
            <div className="card-body">
              {openTasks.length === 0 ? <span className="row muted" style={{ gap: 6 }}><CheckCircle2 size={14} color="#22c55e" /> All caught up</span> : openTasks.map((t) => (
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
              {recentActivity.length === 0 ? <span className="muted">Nothing yet.</span> : recentActivity.map((a) => {
                const Icon = ACT_ICONS[a.type] || FileText;
                const c = ACT_COLORS[a.type] || '#64748b';
                return (
                  <div className="activity-item" key={a.id}>
                    <div className="activity-icon" style={{ background: `${c}1a`, color: c }}><Icon size={14} /></div>
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

      {showNew && <NewLeadModal onClose={() => setShowNew(false)} onCreated={onLeadCreated} />}
    </>
  );
}
