import { useEffect, useState } from 'react';
import { api, money } from '../lib/api.js';
import { Empty } from '../components/ui.jsx';

function Delta({ now, prev, money: isMoney }) {
  if (!prev) return <div className="hint muted">no previous data</div>;
  const pct = Math.round(((now - prev) / prev) * 100);
  const up = pct >= 0;
  return (
    <div className="hint" style={{ color: up ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
      {up ? '▲' : '▼'} {Math.abs(pct)}% vs previous period
      <span className="muted" style={{ fontWeight: 400 }}> ({isMoney ? money(prev) : prev})</span>
    </div>
  );
}

export default function Reports() {
  const [from, setFrom] = useState(() => new Date(Date.now() - 180 * 864e5).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [an, setAn] = useState(null);

  useEffect(() => {
    api(`/reports/sales?from=${from}&to=${to}`).then(setData).catch(console.error);
  }, [from, to]);
  useEffect(() => {
    api(`/reports/analytics?days=${days}`).then(setAn).catch(console.error);
  }, [days]);

  if (!data) return <div className="empty">Loading reports…</div>;
  const maxMonthRev = Math.max(...data.byMonth.map((m) => m.revenue), 1);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Reports & Analytics</h1>
          <div className="sub">How your business is performing — and trending</div>
        </div>
        <select style={{ width: 180 }} value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={180}>Last 180 days</option>
        </select>
      </div>

      {an && (
        <>
          <div className="kpi-grid">
            <div className="kpi">
              <div className="label">New inquiries</div>
              <div className="value">{an.compare.leads}</div>
              <Delta now={an.compare.leads} prev={an.compare.prev_leads} />
            </div>
            <div className="kpi">
              <div className="label">Jobs booked</div>
              <div className="value">{an.compare.booked}</div>
              <Delta now={an.compare.booked} prev={an.compare.prev_booked} />
            </div>
            <div className="kpi">
              <div className="label">Booked value</div>
              <div className="value">{money(an.compare.booked_value)}</div>
              <Delta now={an.compare.booked_value} prev={an.compare.prev_booked_value} money />
            </div>
            <div className="kpi">
              <div className="label">Cash collected</div>
              <div className="value">{money(an.compare.collected)}</div>
              <Delta now={an.compare.collected} prev={an.compare.prev_collected} money />
            </div>
            <div className="kpi">
              <div className="label">Calls received</div>
              <div className="value">{an.callStats.in_period}</div>
              <div className="hint muted">{an.callStats.recorded} recorded all-time</div>
            </div>
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
                    <tr key={t.type}>
                      <td style={{ textTransform: 'capitalize' }}><b>{t.type.replace('_', ' ')}</b></td>
                      <td>{t.jobs}</td>
                      <td>{money(t.avg_value)}</td>
                      <td><b>{money(t.revenue)}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <div className="card-head">Busiest move days</div>
              <table className="data">
                <thead><tr><th>Day</th><th>Moves</th></tr></thead>
                <tbody>
                  {an.busiestDays.map((d) => (
                    <tr key={d.day}><td>{d.day}</td><td><b>{d.moves}</b></td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <div className="card-head">Top customers (all time)</div>
              <table className="data">
                <thead><tr><th>Customer</th><th>Jobs</th><th>Value</th></tr></thead>
                <tbody>
                  {an.topCustomers.map((c) => (
                    <tr key={c.id}><td><b>{c.first_name} {c.last_name}</b></td><td>{c.jobs}</td><td><b>{money(c.value)}</b></td></tr>
                  ))}
                </tbody>
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
        <div className="card-head">Booked revenue by month</div>
        <div className="card-body">
          {data.byMonth.length === 0 ? <Empty>No data in range.</Empty> : (
            <div className="bar-chart">
              {data.byMonth.map((m) => (
                <div className="bar-wrap" key={m.month}>
                  <div className="bar-value">{money(m.revenue)}</div>
                  <div className="bar" style={{ height: `${Math.max((m.revenue / maxMonthRev) * 100, 2)}%` }} />
                  <div className="bar-label">{m.month}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid-2 mt">
        <div className="card">
          <div className="card-head">Lead sources</div>
          <table className="data">
            <thead><tr><th>Source</th><th>Leads</th><th>Booked</th><th>Conv.</th><th>Revenue</th></tr></thead>
            <tbody>
              {data.bySource.map((s) => (
                <tr key={s.source}>
                  <td><b>{s.source}</b></td>
                  <td>{s.leads}</td>
                  <td>{s.booked}</td>
                  <td>{s.leads ? Math.round((s.booked / s.leads) * 100) : 0}%</td>
                  <td><b>{money(s.revenue)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-head">Salesperson performance</div>
          <table className="data">
            <thead><tr><th>Salesperson</th><th>Leads</th><th>Booked</th><th>Conv.</th><th>Revenue</th></tr></thead>
            <tbody>
              {data.bySalesperson.map((s) => (
                <tr key={s.salesperson}>
                  <td><b>{s.salesperson}</b></td>
                  <td>{s.leads}</td>
                  <td>{s.booked}</td>
                  <td>{s.leads ? Math.round((s.booked / s.leads) * 100) : 0}%</td>
                  <td><b>{money(s.revenue)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-head">Lost reasons</div>
          {data.lostReasons.length === 0 ? <Empty>No lost jobs in range 🎉</Empty> : (
            <table className="data">
              <thead><tr><th>Reason</th><th>Count</th></tr></thead>
              <tbody>
                {data.lostReasons.map((r) => (
                  <tr key={r.reason}><td>{r.reason}</td><td><b>{r.count}</b></td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-head">Cash collected by month</div>
          <table className="data">
            <thead><tr><th>Month</th><th>Collected</th></tr></thead>
            <tbody>
              {data.paymentsByMonth.map((m) => (
                <tr key={m.month}><td>{m.month}</td><td><b>{money(m.collected)}</b></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
