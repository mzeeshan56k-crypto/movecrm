import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { api, money, fmtDate, fmtDateTime } from '../lib/api.js';
import { StatusBadge, Field, Empty } from '../components/ui.jsx';

export default function CustomerDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [c, setC] = useState(null);
  const [f, setF] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api(`/customers/${id}`).then((d) => { setC(d); setF(d); }).catch(console.error);
  }, [id]);

  if (!c || !f) return <div className="empty">Loading…</div>;

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

  return (
    <>
      <div className="page-head">
        <div>
          <button className="btn sm" onClick={() => nav(-1)} style={{ marginBottom: 6 }}><ArrowLeft size={14} /> Back</button>
          <h1>{c.first_name} {c.last_name}</h1>
          <div className="sub">Customer since {fmtDate(c.created_at)} · {c.jobs.length} jobs</div>
        </div>
      </div>

      <div className="grid-3070">
        <div>
          <div className="card">
            <div className="card-head">Jobs</div>
            {c.jobs.length === 0 ? <Empty>No jobs yet.</Empty> : (
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
              {c.activities.length === 0 ? <span className="muted">No activity recorded.</span> : c.activities.map((a) => (
                <div className="activity-item" key={a.id}>
                  <div className="activity-icon" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{a.type.slice(0, 2)}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{a.subject || a.type}</div>
                    {a.body && <div className="muted">{a.body}</div>}
                    <div className="muted" style={{ fontSize: 12 }}>{a.user_name || 'System'} · {fmtDateTime(a.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">Contact details</div>
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
