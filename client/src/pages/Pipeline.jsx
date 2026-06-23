import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { api, money, fmtDate } from '../lib/api.js';
import NewLeadModal from '../components/NewLeadModal.jsx';

const COLUMNS = [
  { status: 'lead', label: 'Leads' },
  { status: 'opportunity', label: 'Opportunities' },
  { status: 'booked', label: 'Booked' },
  { status: 'in_progress', label: 'In Progress' },
];

export default function Pipeline() {
  const [jobs, setJobs] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [dragId, setDragId] = useState(null);
  const nav = useNavigate();

  const load = () => api('/jobs?status=lead,opportunity,booked,in_progress').then(setJobs).catch(console.error);
  useEffect(() => { load(); }, []);

  const moveTo = async (jobId, status) => {
    await api(`/jobs/${jobId}`, { method: 'PUT', body: { status } });
    load();
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Sales Pipeline</h1>
          <div className="sub">Drag cards between stages, or click to open</div>
        </div>
        <button className="btn primary" onClick={() => setShowNew(true)}><Plus size={16} /> New Lead</button>
      </div>

      <div className="board">
        {COLUMNS.map((col) => {
          const colJobs = jobs.filter((j) => j.status === col.status);
          const total = colJobs.reduce((s, j) => s + (j.estimated_total || 0), 0);
          return (
            <div
              key={col.status}
              className="col"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dragId && moveTo(dragId, col.status)}
            >
              <h3>
                <span>{col.label} ({colJobs.length})</span>
                <span>{money(total)}</span>
              </h3>
              {colJobs.map((j) => (
                <div
                  key={j.id}
                  className="job-card"
                  draggable
                  onDragStart={() => setDragId(j.id)}
                  onDragEnd={() => setDragId(null)}
                  onClick={() => nav(`/jobs/${j.id}`)}
                >
                  <div className="name">{j.first_name} {j.last_name}</div>
                  <div className="meta">{j.job_number} · {j.move_size || 'Size TBD'}</div>
                  <div className="meta">
                    {j.move_date ? `Move: ${fmtDate(j.move_date)}` : 'No date set'}
                    {j.origin_city ? ` · ${j.origin_city} → ${j.dest_city || '?'}` : ''}
                  </div>
                  {j.lead_source && <div className="meta">Source: {j.lead_source}</div>}
                  <div className="amount">{money(j.estimated_total)}</div>
                </div>
              ))}
              {colJobs.length === 0 && <div className="muted" style={{ padding: 10, fontSize: 13 }}>Nothing here</div>}
            </div>
          );
        })}
      </div>

      {showNew && (
        <NewLeadModal onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); load(); }} />
      )}
    </>
  );
}
