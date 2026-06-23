import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api, STATUS_META } from '../lib/api.js';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [jobs, setJobs] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    api(`/resources/calendar?month=${month}`).then(setJobs).catch(console.error);
  }, [month]);

  const [y, m] = month.split('-').map(Number);
  const firstDay = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const startOffset = firstDay.getDay();
  const todayStr = new Date().toISOString().slice(0, 10);

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const shift = (delta) => {
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthLabel = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Calendar</h1>
          <div className="sub">{jobs.length} scheduled moves in {monthLabel}</div>
        </div>
        <div className="row">
          <button className="btn icon" onClick={() => shift(-1)}><ChevronLeft size={16} /></button>
          <b style={{ width: 150, textAlign: 'center' }}>{monthLabel}</b>
          <button className="btn icon" onClick={() => shift(1)}><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="cal-grid">
        {DOW.map((d) => <div className="dow" key={d}>{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div className="cal-cell dim" key={i} />;
          const dateStr = `${month}-${String(d).padStart(2, '0')}`;
          const dayJobs = jobs.filter((j) => j.move_date === dateStr);
          return (
            <div className={`cal-cell${dateStr === todayStr ? ' today' : ''}`} key={i}>
              <div className="daynum">{d}</div>
              {dayJobs.map((j) => (
                <span
                  key={j.id}
                  className="cal-event"
                  style={{ background: STATUS_META[j.status]?.color || '#64748b' }}
                  onClick={() => nav(`/jobs/${j.id}`)}
                  title={`${j.job_number} · ${j.first_name} ${j.last_name}`}
                >
                  {j.first_name} {j.last_name} {j.move_size ? `· ${j.move_size}` : ''}
                </span>
              ))}
            </div>
          );
        })}
      </div>

      <div className="row mt">
        {Object.entries(STATUS_META).filter(([k]) => !['lost', 'cancelled'].includes(k)).map(([k, v]) => (
          <span key={k} className="row" style={{ gap: 5, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: v.color, display: 'inline-block' }} /> {v.label}
          </span>
        ))}
      </div>
    </>
  );
}
