import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, List } from 'lucide-react';
import { api, money, fmtDate, STATUS_META } from '../lib/api.js';
import { useLive } from '../lib/useLive.js';
import { StatusBadge, Empty } from '../components/ui.jsx';
import NewLeadModal from '../components/NewLeadModal.jsx';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_PER_CELL = 3;

export default function Calendar() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [jobs, setJobs] = useState(null);
  const [view, setView] = useState(window.innerWidth < 760 ? 'list' : 'month');
  const [newDate, setNewDate] = useState(null); // date for the New-move modal
  const reqId = useRef(0);
  const nav = useNavigate();

  const load = () => {
    const id = ++reqId.current;
    return api(`/resources/calendar?month=${month}`)
      .then((d) => { if (id === reqId.current) setJobs(d); })
      .catch(console.error);
  };
  useEffect(() => { load(); }, [month]);
  useLive(load, [month]);

  const [y, m] = month.split('-').map(Number);
  const firstDay = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const startOffset = firstDay.getDay();
  const todayStr = new Date().toISOString().slice(0, 10);
  const monthLabel = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const shift = (delta) => {
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const goToday = () => setMonth(new Date().toISOString().slice(0, 10).slice(0, 7));

  // Group jobs by date once (instead of filtering per cell).
  const byDate = {};
  for (const j of jobs || []) (byDate[j.move_date] ||= []).push(j);

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Calendar</h1>
          <div className="sub">{jobs === null ? 'Loading…' : `${jobs.length} scheduled move${jobs.length === 1 ? '' : 's'} in ${monthLabel}`}</div>
        </div>
        <div className="row">
          <div className="seg">
            <button className={view === 'month' ? 'on' : ''} onClick={() => setView('month')} title="Month view"><CalendarDays size={15} /></button>
            <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')} title="List view"><List size={15} /></button>
          </div>
          <button className="btn sm" onClick={goToday}>Today</button>
          <button className="btn icon" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft size={16} /></button>
          <b style={{ width: 140, textAlign: 'center' }}>{monthLabel}</b>
          <button className="btn icon" onClick={() => shift(1)} aria-label="Next month"><ChevronRight size={16} /></button>
        </div>
      </div>

      {jobs === null ? (
        <div className="skeleton" style={{ height: 520 }} />
      ) : view === 'month' ? (
        <div className="cal-grid">
          {DOW.map((d) => <div className="dow" key={d}>{d}</div>)}
          {cells.map((d, i) => {
            if (!d) return <div className="cal-cell dim" key={i} />;
            const dateStr = `${month}-${String(d).padStart(2, '0')}`;
            const dayJobs = byDate[dateStr] || [];
            const shown = dayJobs.slice(0, MAX_PER_CELL);
            return (
              <div className={`cal-cell${dateStr === todayStr ? ' today' : ''}`} key={i} onClick={() => setNewDate(dateStr)} title="Click to schedule a move">
                <div className="daynum">{d}</div>
                {shown.map((j) => (
                  <span
                    key={j.id}
                    className="cal-event"
                    style={{ background: STATUS_META[j.status]?.color || '#64748b' }}
                    onClick={(e) => { e.stopPropagation(); nav(`/jobs/${j.id}`); }}
                    title={`${j.job_number} · ${j.first_name} ${j.last_name}${j.arrival_window ? ' · ' + j.arrival_window : ''}`}
                  >
                    {j.arrival_window ? `${j.arrival_window.split(' ')[0]} ` : ''}{j.first_name} {j.last_name}
                  </span>
                ))}
                {dayJobs.length > MAX_PER_CELL && (
                  <span className="cal-more" onClick={(e) => { e.stopPropagation(); setView('list'); }}>+{dayJobs.length - MAX_PER_CELL} more</span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          {jobs.length === 0 ? (
            <Empty>No moves scheduled in {monthLabel}.</Empty>
          ) : (
            Object.keys(byDate).sort().map((date) => (
              <div key={date} className="agenda-day">
                <div className="agenda-date">
                  {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {date === todayStr && <span className="badge" style={{ background: 'var(--primary)', marginLeft: 8 }}>Today</span>}
                </div>
                {byDate[date].map((j) => (
                  <div key={j.id} className="agenda-item" onClick={() => nav(`/jobs/${j.id}`)}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: STATUS_META[j.status]?.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{j.first_name} {j.last_name} <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>· {j.job_number}</span></div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {j.arrival_window || 'No time set'}{j.move_size ? ` · ${j.move_size}` : ''}
                      </div>
                    </div>
                    <StatusBadge status={j.status} />
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      <div className="row mt">
        {Object.entries(STATUS_META).filter(([k]) => !['lost', 'cancelled'].includes(k)).map(([k, v]) => (
          <span key={k} className="row" style={{ gap: 5, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: v.color, display: 'inline-block' }} /> {v.label}
          </span>
        ))}
      </div>

      {newDate && (
        <NewLeadModal initialDate={newDate} onClose={() => setNewDate(null)} onCreated={(job) => nav(`/jobs/${job.id}`)} />
      )}
    </>
  );
}
