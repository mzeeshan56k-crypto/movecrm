import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, GripVertical } from 'lucide-react';
import { api, money, fmtDate, STATUS_META } from '../lib/api.js';
import { useLive } from '../lib/useLive.js';
import NewLeadModal from '../components/NewLeadModal.jsx';

const COLUMNS = [
  { status: 'lead', label: 'Leads' },
  { status: 'opportunity', label: 'Opportunities' },
  { status: 'booked', label: 'Booked' },
  { status: 'in_progress', label: 'In Progress' },
];
// Stages a card can be moved to from the board (includes exits to keep/lose).
const MOVE_OPTIONS = ['lead', 'opportunity', 'booked', 'in_progress', 'completed', 'lost'];
const LEAVES_BOARD = ['completed', 'lost', 'cancelled'];

function PipelineSkeleton() {
  return (
    <>
      <div className="page-head"><div><h1>Sales Pipeline</h1><div className="sub">Drag cards between stages, or use the stage menu</div></div></div>
      <div className="board">
        {COLUMNS.map((c) => (
          <div className="col" key={c.status}>
            <h3><span>{c.label}</span></h3>
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 92, marginBottom: 8 }} />)}
          </div>
        ))}
      </div>
    </>
  );
}

export default function Pipeline() {
  const [jobs, setJobs] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const reqId = useRef(0);
  const nav = useNavigate();

  const load = () => {
    const id = ++reqId.current;
    return api('/jobs?status=lead,opportunity,booked,in_progress')
      .then((d) => { if (id === reqId.current) setJobs(d); })
      .catch(console.error);
  };
  useEffect(() => { load(); }, []);
  useLive(load, []);

  // Optimistic move: update the board instantly, sync in the background, revert on error.
  const moveTo = async (jobId, status) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job || job.status === status) return;
    const prev = jobs;
    setJobs(LEAVES_BOARD.includes(status)
      ? jobs.filter((j) => j.id !== jobId)
      : jobs.map((j) => (j.id === jobId ? { ...j, status } : j)));
    try {
      await api(`/jobs/${jobId}`, { method: 'PUT', body: { status } });
      load();
    } catch (e) {
      console.error(e);
      setJobs(prev); // revert
    }
  };

  if (!jobs) return <PipelineSkeleton />;
  const openTotal = jobs.reduce((s, j) => s + (j.estimated_total || 0), 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Sales Pipeline</h1>
          <div className="sub">{jobs.length} open deals · {money(openTotal)} pipeline value — drag cards or use the stage menu</div>
        </div>
        <button className="btn primary" onClick={() => setShowNew(true)}><Plus size={16} /> New Lead</button>
      </div>

      <div className="board">
        {COLUMNS.map((col) => {
          const meta = STATUS_META[col.status];
          const colJobs = jobs.filter((j) => j.status === col.status);
          const total = colJobs.reduce((s, j) => s + (j.estimated_total || 0), 0);
          return (
            <div
              key={col.status}
              className={`col${overCol === col.status ? ' over' : ''}`}
              style={{ borderTop: `3px solid ${meta.color}` }}
              onDragOver={(e) => { e.preventDefault(); if (overCol !== col.status) setOverCol(col.status); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOverCol((c) => (c === col.status ? null : c)); }}
              onDrop={() => { if (dragId) moveTo(dragId, col.status); setOverCol(null); }}
            >
              <h3>
                <span className="row" style={{ gap: 7 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 999, background: meta.color }} />
                  {col.label} <span className="col-count">{colJobs.length}</span>
                </span>
                <span>{money(total)}</span>
              </h3>

              {colJobs.map((j) => (
                <div
                  key={j.id}
                  className={`job-card${dragId === j.id ? ' dragging' : ''}`}
                  style={{ borderLeft: `3px solid ${meta.color}` }}
                  draggable
                  onDragStart={() => setDragId(j.id)}
                  onDragEnd={() => { setDragId(null); setOverCol(null); }}
                  onClick={() => nav(`/jobs/${j.id}`)}
                >
                  <div className="row spread" style={{ alignItems: 'flex-start' }}>
                    <div className="name">{j.first_name} {j.last_name}</div>
                    <GripVertical size={15} className="grip" />
                  </div>
                  <div className="meta">{j.job_number} · {j.move_size || 'Size TBD'}</div>
                  <div className="meta">
                    {j.move_date ? `Move: ${fmtDate(j.move_date)}` : 'No date set'}
                    {j.origin_city ? ` · ${j.origin_city} → ${j.dest_city || '?'}` : ''}
                  </div>
                  {j.lead_source && <div className="meta">Source: {j.lead_source}</div>}
                  <div className="row spread" style={{ marginTop: 8, alignItems: 'center' }}>
                    <div className="amount">{money(j.estimated_total)}</div>
                    <select
                      className="stage-select"
                      value={j.status}
                      title="Move to stage"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onChange={(e) => { e.stopPropagation(); moveTo(j.id, e.target.value); }}
                    >
                      {MOVE_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_META[s]?.label || s}</option>)}
                    </select>
                  </div>
                </div>
              ))}

              {colJobs.length === 0 && (
                <div className="col-empty">Drop a deal here</div>
              )}
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
