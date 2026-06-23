import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Users } from 'lucide-react';
import { api, money } from '../lib/api.js';
import { StatusBadge, Empty } from '../components/ui.jsx';

export default function Dispatch() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    api(`/resources/dispatch?date=${date}`).then(setData).catch(console.error);
  }, [date]);

  if (!data) return <div className="empty">Loading…</div>;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dispatch Board</h1>
          <div className="sub">{data.jobs.length} jobs scheduled</div>
        </div>
        <input type="date" style={{ width: 170 }} value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="grid-3070">
        <div className="card">
          <div className="card-head">Jobs for {date}</div>
          {data.jobs.length === 0 ? <Empty>No booked jobs on this date.</Empty> : (
            <table className="data">
              <thead><tr><th>Window</th><th>Job</th><th>Customer</th><th>Route</th><th>Crew</th><th>Truck</th><th>Status</th></tr></thead>
              <tbody>
                {data.jobs.map((j) => (
                  <tr key={j.id} className="clickable" onClick={() => nav(`/jobs/${j.id}`)}>
                    <td>{j.arrival_window || '—'}</td>
                    <td><b>{j.job_number}</b><div className="muted" style={{ fontSize: 12 }}>{j.move_size}</div></td>
                    <td>{j.first_name} {j.last_name}<div className="muted" style={{ fontSize: 12 }}>{j.customer_phone}</div></td>
                    <td className="muted">{j.origin_city} → {j.dest_city}</td>
                    <td>{j.crew.length ? j.crew.map((c) => c.name.split(' ')[0]).join(', ') : <span className="error-text">Unassigned</span>}</td>
                    <td>{j.trucks.length ? j.trucks.map((t) => t.name).join(', ') : <span className="error-text">—</span>}</td>
                    <td><StatusBadge status={j.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div>
          <div className="card">
            <div className="card-head"><span className="row"><Users size={15} /> Crew availability</span></div>
            <div className="card-body">
              {data.crew.map((c) => (
                <div key={c.id} className="row spread" style={{ padding: '6px 0' }}>
                  <div><b>{c.name}</b> <span className="muted">· {c.role}</span></div>
                  <span className="badge" style={{ background: c.assigned ? '#f59e0b' : '#22c55e' }}>
                    {c.assigned ? 'Assigned' : 'Available'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="card mt">
            <div className="card-head"><span className="row"><Truck size={15} /> Truck availability</span></div>
            <div className="card-body">
              {data.trucks.map((t) => (
                <div key={t.id} className="row spread" style={{ padding: '6px 0' }}>
                  <div><b>{t.name}</b> <span className="muted">· {t.capacity_cuft} cu ft</span></div>
                  <span className="badge" style={{ background: t.assigned ? '#f59e0b' : '#22c55e' }}>
                    {t.assigned ? 'Assigned' : 'Available'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
