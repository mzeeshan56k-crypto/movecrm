import { useEffect, useState } from 'react';
import { Mail, Save, Download, UserPlus, CalendarCheck, DollarSign, TrendingUp, Phone } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { api, money } from '../lib/api.js';
import { Empty } from '../components/ui.jsx';

const compactMoney = (n) => new Intl.NumberFormat('en-US', { notation: 'compact', style: 'currency', currency: 'USD', maximumFractionDigits: 1 }).format(Number(n) || 0);

function ReportSchedule() {
  const [s, setS] = useState(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => { api('/reports/schedule').then(setS).catch(() => setS({ report_frequency: 'off', report_recipients: '' })); }, []);
  if (!s) return null;
  const save = async () => { await api('/reports/schedule', { method: 'PUT', body: s }); setSaved(true); setTimeout(() => setSaved(false), 1500); };
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-head"><span className="row" style={{ gap: 8 }}><Mail size={16} /> Email reports</span></div>
      <div className="card-body">
        <p className="muted" style={{ marginTop: 0 }}>Get this performance summary emailed automatically — weekly (every Monday) or monthly (the 1st).</p>
        <div className="row" style={{ gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label className="field" style={{ marginBottom: 0, width: 200 }}>
            <span>Frequency</span>
            <select value={s.report_frequency} onChange={(e) => setS({ ...s, report_frequency: e.target.value })}>
              <option value="off">Off</option><option value="weekly">Weekly (Mondays)</option><option value="monthly">Monthly (1st)</option>
            </select>
          </label>
          <label className="field" style={{ marginBottom: 0, flex: 1, minWidth: 240 }}>
            <span>Send to (comma-separated emails)</span>
            <input value={s.report_recipients} onChange={(e) => setS({ ...s, report_recipients: e.target.value })} placeholder="you@company.com, manager@company.com" />
          </label>
          <button className="btn primary" onClick={save}><Save size={15} /> {saved ? 'Saved!' : 'Save'}</button>
        </div>
        <p className="muted" style={{ fontSize: 12, marginBottom: 0, marginTop: 10 }}>Leave recipients blank to send to all admins. (Email delivery activates once the platform owner connects an email key.)</p>
      </div>
    </div>
  );
}

function Delta({ now, prev, money: isMoney }) {
  if (!prev) return <div className="hint muted">no previous data</div>;
  const pct = Math.round(((now - prev) / prev) * 100);
  const up = pct >= 0;
  return (
    <div className="hint" style={{ color: up ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
      {up ? '▲' : '▼'} {Math.abs(pct)}% <span className="muted" style={{ fontWeight: 400 }}>vs prev ({isMoney ? money(prev) : prev})</span>
    </div>
  );
}

function RichKpi({ icon: Icon, label, value, color, children }) {
  return (
    <div className="kpi kpi-rich">
      <div className="kpi-icon" style={{ background: `${color}1a`, color }}><Icon size={18} /></div>
      <div style={{ minWidth: 0 }}><div className="label">{label}</div><div className="value">{value}</div>{children}</div>
    </div>
  );
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', boxShadow: 'var(--shadow)', fontSize: 13 }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p) => <div key={p.name} style={{ color: p.color }}>{p.name}: <b>{p.dataKey === 'revenue' ? money(p.value) : p.value}</b></div>)}
    </div>
  );
}

export default function Reports() {
  const [from, setFrom] = useState(() => new Date(Date.now() - 180 * 864e5).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [an, setAn] = useState(null);

  useEffect(() => { api(`/reports/sales?from=${from}&to=${to}`).then(setData).catch(console.error); }, [from, to]);
  useEffect(() => { api(`/reports/analytics?days=${days}`).then(setAn).catch(console.error); }, [days]);

  const exportCsv = () => {
    if (!data) return;
    const rows = [['MONTHLY PERFORMANCE'], ['Month', 'Leads', 'Booked', 'Revenue']];
    data.byMonth.forEach((m) => rows.push([m.month, m.leads, m.booked, m.revenue]));
    rows.push([], ['LEAD SOURCES'], ['Source', 'Leads', 'Booked', 'Revenue']);
    data.bySource.forEach((s) => rows.push([s.source, s.leads, s.booked, s.revenue]));
    rows.push([], ['SALESPEOPLE'], ['Salesperson', 'Leads', 'Booked', 'Revenue']);
    data.bySalesperson.forEach((s) => rows.push([s.salesperson, s.leads, s.booked, s.revenue]));
    rows.push([], ['CASH COLLECTED'], ['Month', 'Collected']);
    data.paymentsByMonth.forEach((m) => rows.push([m.month, m.collected]));
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `movecrm-report-${from}_to_${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (!data) {
    return (
      <>
        <div className="page-head"><div><h1>Reports & Analytics</h1><div className="sub">Loading…</div></div></div>
        <div className="kpi-grid">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton skeleton-kpi" />)}</div>
        <div className="grid-2"><div className="skeleton" style={{ height: 220 }} /><div className="skeleton" style={{ height: 220 }} /></div>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Reports & Analytics</h1>
          <div className="sub">How your business is performing — and trending</div>
        </div>
        <div className="row">
          <button className="btn" onClick={exportCsv}><Download size={15} /> Export CSV</button>
          <select style={{ width: 170 }} value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option><option value={180}>Last 180 days</option>
          </select>
        </div>
      </div>

      <ReportSchedule />

      {an && (
        <>
          <div className="kpi-grid">
            <RichKpi icon={UserPlus} label="New inquiries" value={an.compare.leads} color="#6366f1"><Delta now={an.compare.leads} prev={an.compare.prev_leads} /></RichKpi>
            <RichKpi icon={CalendarCheck} label="Jobs booked" value={an.compare.booked} color="#22c55e"><Delta now={an.compare.booked} prev={an.compare.prev_booked} /></RichKpi>
            <RichKpi icon={TrendingUp} label="Booked value" value={compactMoney(an.compare.booked_value)} color="#0ea5e9"><Delta now={an.compare.booked_value} prev={an.compare.prev_booked_value} money /></RichKpi>
            <RichKpi icon={DollarSign} label="Cash collected" value={compactMoney(an.compare.collected)} color="#10b981"><Delta now={an.compare.collected} prev={an.compare.prev_collected} money /></RichKpi>
            <RichKpi icon={Phone} label="Calls received" value={an.callStats.in_period} color="#f59e0b"><div className="hint muted">{an.callStats.recorded} recorded all-time</div></RichKpi>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-head">Sales funnel — last {an.days} days</div>
              <div className="card-body">
                {[
                  ['Inquiries received', an.funnel.inquiries, '#6366f1'],
                  ['Became opportunities', an.funnel.reached_opportunity, '#0ea5e9'],
                  ['Booked', an.funnel.booked, '#22c55e'],
                  ['Completed', an.funnel.completed, '#10b981'],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <div className="row spread" style={{ marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{label}</span>
                      <b>{val}{an.funnel.inquiries ? ` (${Math.round((val / an.funnel.inquiries) * 100)}%)` : ''}</b>
                    </div>
                    <div style={{ background: '#eef2f7', borderRadius: 6, height: 14 }}>
                      <div style={{ width: `${an.funnel.inquiries ? (val / an.funnel.inquiries) * 100 : 0}%`, background: color, height: '100%', borderRadius: 6 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-head">Revenue by move type — last {an.days} days</div>
              <table className="data">
                <thead><tr><th>Type</th><th>Jobs</th><th>Avg value</th><th>Revenue</th></tr></thead>
                <tbody>
                  {an.byType.map((t) => (
                    <tr key={t.type}><td style={{ textTransform: 'capitalize' }}><b>{t.type.replace('_', ' ')}</b></td><td>{t.jobs}</td><td>{money(t.avg_value)}</td><td><b>{money(t.revenue)}</b></td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <div className="card-head">Busiest move days</div>
              <table className="data">
                <thead><tr><th>Day</th><th>Moves</th></tr></thead>
                <tbody>{an.busiestDays.map((d) => <tr key={d.day}><td>{d.day}</td><td><b>{d.moves}</b></td></tr>)}</tbody>
              </table>
            </div>

            <div className="card">
              <div className="card-head">Top customers (all time)</div>
              <table className="data">
                <thead><tr><th>Customer</th><th>Jobs</th><th>Value</th></tr></thead>
                <tbody>{an.topCustomers.map((c) => <tr key={c.id}><td><b>{c.first_name} {c.last_name}</b></td><td>{c.jobs}</td><td><b>{money(c.value)}</b></td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="page-head mt">
        <h2 style={{ fontSize: 17 }}>Detailed history</h2>
        <div className="row">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <span className="muted">to</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <div className="card-head">Leads, bookings & revenue by month</div>
        <div className="card-body">
          {data.byMonth.length === 0 ? <Empty>No data in range.</Empty> : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={data.byMonth} margin={{ top: 10, right: 8, left: -6, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="l" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis yAxisId="r" orientation="right" tickFormatter={compactMoney} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} verticalAlign="top" align="right" />
                <Bar yAxisId="l" dataKey="leads" name="Leads" fill="#c7d2fe" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar yAxisId="l" dataKey="booked" name="Booked" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={16} />
                <Line yAxisId="r" type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid-2 mt">
        <div className="card">
          <div className="card-head">Lead sources</div>
          <table className="data">
            <thead><tr><th>Source</th><th>Leads</th><th>Booked</th><th>Conv.</th><th>Revenue</th></tr></thead>
            <tbody>{data.bySource.map((s) => <tr key={s.source}><td><b>{s.source}</b></td><td>{s.leads}</td><td>{s.booked}</td><td>{s.leads ? Math.round((s.booked / s.leads) * 100) : 0}%</td><td><b>{money(s.revenue)}</b></td></tr>)}</tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-head">Salesperson performance</div>
          <table className="data">
            <thead><tr><th>Salesperson</th><th>Leads</th><th>Booked</th><th>Conv.</th><th>Revenue</th></tr></thead>
            <tbody>{data.bySalesperson.map((s) => <tr key={s.salesperson}><td><b>{s.salesperson}</b></td><td>{s.leads}</td><td>{s.booked}</td><td>{s.leads ? Math.round((s.booked / s.leads) * 100) : 0}%</td><td><b>{money(s.revenue)}</b></td></tr>)}</tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-head">Lost reasons</div>
          {data.lostReasons.length === 0 ? <Empty>No lost jobs in range 🎉</Empty> : (
            <table className="data">
              <thead><tr><th>Reason</th><th>Count</th></tr></thead>
              <tbody>{data.lostReasons.map((r) => <tr key={r.reason}><td>{r.reason}</td><td><b>{r.count}</b></td></tr>)}</tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-head">Cash collected by month</div>
          <table className="data">
            <thead><tr><th>Month</th><th>Collected</th></tr></thead>
            <tbody>{data.paymentsByMonth.map((m) => <tr key={m.month}><td>{m.month}</td><td><b>{money(m.collected)}</b></td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </>
  );
}
