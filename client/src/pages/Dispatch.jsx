import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Users, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';
import { api } from '../lib/api.js';
import { useLive } from '../lib/useLive.js';
import { StatusBadge, Empty, Modal, Field } from '../components/ui.jsx';

const addDays = (dateStr, n) => {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

function AssignModal({ job, crew, trucks, assignedElsewhere, onClose, onSaved }) {
  const [crewIds, setCrewIds] = useState(job.crew.map((c) => c.id));
  const [truckIds, setTruckIds] = useState(job.trucks.map((t) => t.id));
  const [window_, setWindow] = useState(job.arrival_window || '');
  const [notes, setNotes] = useState(job.crew_notes || '');
  const [busy, setBusy] = useState(false);
  const toggle = (list, set, id) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const save = async () => {
    setBusy(true);
    try {
      await api(`/jobs/${job.id}/dispatch`, { method: 'PUT', body: { crew_ids: crewIds, truck_ids: truckIds, arrival_window: window_, crew_notes: notes } });
      onSaved();
    } catch (e) { alert(e.message); } finally { setBusy(false); }
  };
  return (
    <Modal
      title={`Assign — ${job.job_number} · ${job.first_name} ${job.last_name}`}
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save assignment'}</button></>}
    >
      <Field label="Arrival window"><input value={window_} onChange={(e) => setWindow(e.target.value)} placeholder="8:00 - 10:00" /></Field>
      <div className="grid-2">
        <div>
          <div className="section-title" style={{ marginTop: 0 }}>Crew</div>
          {crew.length === 0 ? <span className="muted">No crew yet — add crew in Settings.</span> : crew.map((c) => {
            const elsewhere = assignedElsewhere.crew[c.id]?.filter((n) => n !== job.job_number) || [];
            return (
              <label key={c.id} className="row" style={{ padding: '5px 0', cursor: 'pointer' }}>
                <input type="checkbox" style={{ width: 'auto' }} checked={crewIds.includes(c.id)} onChange={() => toggle(crewIds, setCrewIds, c.id)} />
                <div><b>{c.name}</b> <span className="muted">· {c.role}</span>
                  {elsewhere.length > 0 && <span className="error-text" style={{ fontSize: 11, marginLeft: 4 }}>on {elsewhere.join(', ')}</span>}
                </div>
              </label>
            );
          })}
        </div>
        <div>
          <div className="section-title" style={{ marginTop: 0 }}>Trucks</div>
          {trucks.length === 0 ? <span className="muted">No trucks yet — add in Settings.</span> : trucks.map((t) => {
            const elsewhere = assignedElsewhere.trucks[t.id]?.filter((n) => n !== job.job_number) || [];
            return (
              <label key={t.id} className="row" style={{ padding: '5px 0', cursor: 'pointer' }}>
                <input type="checkbox" style={{ width: 'auto' }} checked={truckIds.includes(t.id)} onChange={() => toggle(truckIds, setTruckIds, t.id)} />
                <div><b>{t.name}</b> <span className="muted">· {t.capacity_cuft} cu ft</span>
                  {elsewhere.length > 0 && <span className="error-text" style={{ fontSize: 11, marginLeft: 4 }}>on {elsewhere.join(', ')}</span>}
                </div>
              </label>
            );
          })}
        </div>
      </div>
      <Field label="Notes for crew"><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gate code, parking, fragile items…" /></Field>
    </Modal>
  );
}

export default function Dispatch() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState(null);
  const [assignJob, setAssignJob] = useState(null);
  const reqId = useRef(0);
  const nav = useNavigate();

  const load = () => {
    const id = ++reqId.current;
    return api(`/resources/dispatch?date=${date}`).then((d) => { if (id === reqId.current) setData(d); }).catch(console.error);
  };
  useEffect(() => { load(); }, [date]);
  useLive(load, [date]);

  const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (!data) {
    return (
      <>
        <div className="page-head"><div><h1>Dispatch Board</h1><div className="sub">Loading…</div></div></div>
        <div className="skeleton" style={{ height: 360 }} />
      </>
    );
  }

  // Map each crew/truck to the jobs it's assigned to today (for conflict hints + panels).
  const assignedElsewhere = { crew: {}, trucks: {} };
  for (const j of data.jobs) {
    for (const c of j.crew) (assignedElsewhere.crew[c.id] ||= []).push(j.job_number);
    for (const t of j.trucks) (assignedElsewhere.trucks[t.id] ||= []).push(j.job_number);
  }
  const unassigned = data.jobs.filter((j) => j.crew.length === 0).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dispatch Board</h1>
          <div className="sub">
            {data.jobs.length} move{data.jobs.length === 1 ? '' : 's'} · {dateLabel}
            {unassigned > 0 && <span className="error-text" style={{ marginLeft: 8 }}>· {unassigned} unassigned</span>}
          </div>
        </div>
        <div className="row">
          <button className="btn sm" onClick={() => setDate(new Date().toISOString().slice(0, 10))}>Today</button>
          <button className="btn icon" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day"><ChevronLeft size={16} /></button>
          <input type="date" style={{ width: 150 }} value={date} onChange={(e) => setDate(e.target.value)} />
          <button className="btn icon" onClick={() => setDate(addDays(date, 1))} aria-label="Next day"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="grid-3070">
        <div className="card">
          <div className="card-head">Jobs for {dateLabel}</div>
          {data.jobs.length === 0 ? <Empty>No booked moves on this date.</Empty> : (
            <table className="data">
              <thead><tr><th>Window</th><th>Job</th><th>Customer</th><th>Route</th><th>Crew</th><th>Truck</th><th /></tr></thead>
              <tbody>
                {data.jobs.map((j) => (
                  <tr key={j.id}>
                    <td onClick={() => nav(`/jobs/${j.id}`)} style={{ cursor: 'pointer' }}>{j.arrival_window || '—'}</td>
                    <td onClick={() => nav(`/jobs/${j.id}`)} style={{ cursor: 'pointer' }}><b>{j.job_number}</b><div className="muted" style={{ fontSize: 12 }}>{j.move_size}</div></td>
                    <td>{j.first_name} {j.last_name}<div className="muted" style={{ fontSize: 12 }}>{j.customer_phone}</div></td>
                    <td className="muted">{j.origin_city} → {j.dest_city}</td>
                    <td>{j.crew.length ? j.crew.map((c) => c.name.split(' ')[0]).join(', ') : <span className="error-text">Unassigned</span>}</td>
                    <td>{j.trucks.length ? j.trucks.map((t) => t.name).join(', ') : <span className="muted">—</span>}</td>
                    <td><button className="btn sm" onClick={() => setAssignJob(j)}><UserPlus size={13} /> Assign</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div>
          <div className="card">
            <div className="card-head"><span className="row" style={{ gap: 7 }}><Users size={15} /> Crew · {data.crew.filter((c) => !c.assigned).length} free</span></div>
            <div className="card-body">
              {data.crew.length === 0 ? <span className="muted">No crew yet — add in Settings → Crew.</span> : data.crew.map((c) => (
                <div key={c.id} className="row spread" style={{ padding: '6px 0' }}>
                  <div><b>{c.name}</b> <span className="muted">· {c.role}</span></div>
                  {c.assigned
                    ? <span className="muted" style={{ fontSize: 12 }}>{(assignedElsewhere.crew[c.id] || []).join(', ')}</span>
                    : <span className="badge" style={{ background: '#22c55e' }}>Available</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="card mt">
            <div className="card-head"><span className="row" style={{ gap: 7 }}><Truck size={15} /> Trucks · {data.trucks.filter((t) => !t.assigned).length} free</span></div>
            <div className="card-body">
              {data.trucks.length === 0 ? <span className="muted">No trucks yet — add in Settings → Trucks.</span> : data.trucks.map((t) => (
                <div key={t.id} className="row spread" style={{ padding: '6px 0' }}>
                  <div><b>{t.name}</b> <span className="muted">· {t.capacity_cuft} cu ft</span></div>
                  {t.assigned
                    ? <span className="muted" style={{ fontSize: 12 }}>{(assignedElsewhere.trucks[t.id] || []).join(', ')}</span>
                    : <span className="badge" style={{ background: '#22c55e' }}>Available</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {assignJob && (
        <AssignModal
          job={assignJob}
          crew={data.crew}
          trucks={data.trucks}
          assignedElsewhere={assignedElsewhere}
          onClose={() => setAssignJob(null)}
          onSaved={() => { setAssignJob(null); load(); }}
        />
      )}
    </>
  );
}
