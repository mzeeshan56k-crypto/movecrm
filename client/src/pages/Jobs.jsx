import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { api, money, fmtDate, STATUS_META, JOB_TYPES } from '../lib/api.js';
import { StatusBadge, Empty } from '../components/ui.jsx';
import NewLeadModal from '../components/NewLeadModal.jsx';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [showNew, setShowNew] = useState(false);
  const nav = useNavigate();

  const load = () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    api(`/jobs?${params}`).then(setJobs).catch(console.error);
  };
  useEffect(() => { load(); }, [status]);
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Jobs</h1>
          <div className="sub">{jobs.length} jobs</div>
        </div>
        <div className="row">
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--muted)' }} />
            <input style={{ paddingLeft: 32, width: 240 }} placeholder="Search name, job #, phone…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select style={{ width: 160 }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button className="btn primary" onClick={() => setShowNew(true)}><Plus size={16} /> New Lead</button>
        </div>
      </div>

      <div className="card">
        {jobs.length === 0 ? <Empty>No jobs match your filters.</Empty> : (
          <table className="data">
            <thead>
              <tr><th>Job #</th><th>Customer</th><th>Status</th><th>Type</th><th>Move date</th><th>Route</th><th>Size</th><th>Salesperson</th><th>Estimate</th></tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="clickable" onClick={() => nav(`/jobs/${j.id}`)}>
                  <td><b>{j.job_number}</b></td>
                  <td>{j.first_name} {j.last_name}<div className="muted" style={{ fontSize: 12 }}>{j.customer_phone}</div></td>
                  <td><StatusBadge status={j.status} /></td>
                  <td>{JOB_TYPES[j.type] || j.type}</td>
                  <td>{fmtDate(j.move_date)}</td>
                  <td className="muted">{j.origin_city || '—'} → {j.dest_city || '—'}</td>
                  <td>{j.move_size || '—'}</td>
                  <td>{j.salesperson || '—'}</td>
                  <td><b>{money(j.estimated_total)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showNew && <NewLeadModal onClose={() => setShowNew(false)} onCreated={(job) => nav(`/jobs/${job.id}`)} />}
    </>
  );
}
