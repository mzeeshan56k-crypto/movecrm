import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, ClipboardList, AlertCircle, Clock } from 'lucide-react';
import { api, fmtDate } from '../lib/api.js';
import { useLive } from '../lib/useLive.js';
import { useAuth } from '../lib/auth.jsx';
import { Empty } from '../components/ui.jsx';

const todayStr = () => new Date().toISOString().slice(0, 10);
const dueState = (t) => {
  if (t.completed || !t.due_date) return null;
  if (t.due_date < todayStr()) return 'overdue';
  if (t.due_date === todayStr()) return 'today';
  return null;
};

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState(null);
  const [users, setUsers] = useState([]);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [assignee, setAssignee] = useState('');
  const [showDone, setShowDone] = useState(false);
  const [mine, setMine] = useState(false);
  const reqId = useRef(0);

  const load = () => {
    const id = ++reqId.current;
    return api('/settings/tasks').then((d) => { if (id === reqId.current) setTasks(d); }).catch(console.error);
  };
  useEffect(() => { load(); api('/settings/users').then(setUsers).catch(() => {}); }, []);
  useLive(load, []);

  const add = async () => {
    if (!title) return;
    await api('/settings/tasks', { method: 'POST', body: { title, due_date: due || null, assigned_to: assignee || null } });
    setTitle(''); setDue('');
    load();
  };

  // Optimistic check-off so it feels instant.
  const toggle = async (t) => {
    const prev = tasks;
    setTasks(tasks.map((x) => (x.id === t.id ? { ...x, completed: t.completed ? 0 : 1 } : x)));
    try { await api(`/settings/tasks/${t.id}`, { method: 'PUT', body: { completed: t.completed ? 0 : 1 } }); load(); }
    catch (e) { setTasks(prev); }
  };

  const remove = async (t) => {
    const prev = tasks;
    setTasks(tasks.filter((x) => x.id !== t.id));
    try { await api(`/settings/tasks/${t.id}`, { method: 'DELETE' }); } catch (e) { setTasks(prev); }
  };

  const all = tasks || [];
  const stats = {
    open: all.filter((t) => !t.completed).length,
    overdue: all.filter((t) => dueState(t) === 'overdue').length,
    today: all.filter((t) => dueState(t) === 'today').length,
  };
  const visible = all.filter((t) => (showDone || !t.completed) && (!mine || t.assigned_to === user?.id));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Tasks</h1>
          <div className="sub">{tasks === null ? 'Loading…' : `${stats.open} open task${stats.open === 1 ? '' : 's'}`}</div>
        </div>
        <div className="row">
          <div className="seg">
            <button className={!mine ? 'on' : ''} onClick={() => setMine(false)}>All</button>
            <button className={mine ? 'on' : ''} onClick={() => setMine(true)}>Mine</button>
          </div>
          <label className="row" style={{ cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Show completed
          </label>
        </div>
      </div>

      {tasks !== null && all.length > 0 && (
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(160px, 240px))' }}>
          <div className="kpi kpi-rich"><div className="kpi-icon" style={{ background: '#6366f11a', color: '#6366f1' }}><ClipboardList size={18} /></div><div><div className="label">Open</div><div className="value">{stats.open}</div></div></div>
          <div className="kpi kpi-rich"><div className="kpi-icon" style={{ background: '#ef44441a', color: '#ef4444' }}><AlertCircle size={18} /></div><div><div className="label">Overdue</div><div className="value">{stats.overdue}</div></div></div>
          <div className="kpi kpi-rich"><div className="kpi-icon" style={{ background: '#f59e0b1a', color: '#f59e0b' }}><Clock size={18} /></div><div><div className="label">Due today</div><div className="value">{stats.today}</div></div></div>
        </div>
      )}

      <div className="card">
        <div className="card-body row">
          <input style={{ flex: 2, minWidth: 200 }} placeholder="New task…" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <input type="date" style={{ width: 160 }} value={due} onChange={(e) => setDue(e.target.value)} />
          <select style={{ width: 170 }} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Assign to me</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <button className="btn primary" onClick={add} disabled={!title}><Plus size={15} /> Add</button>
        </div>
      </div>

      <div className="card mt">
        {tasks === null ? (
          <div className="card-body">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 20, marginBottom: 10 }} />)}</div>
        ) : visible.length === 0 ? (
          <Empty>{all.length === 0 ? 'No tasks yet — add one above to stay on top of follow-ups.' : mine ? 'No tasks assigned to you.' : 'No tasks. Enjoy the quiet!'}</Empty>
        ) : (
          <table className="data">
            <thead><tr><th style={{ width: 36 }} /><th>Task</th><th>Job</th><th>Assignee</th><th>Due</th><th /></tr></thead>
            <tbody>
              {visible.map((t) => {
                const st = dueState(t);
                return (
                  <tr key={t.id}>
                    <td><input type="checkbox" style={{ width: 'auto' }} checked={!!t.completed} onChange={() => toggle(t)} /></td>
                    <td style={{ textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? 'var(--muted)' : 'inherit', fontWeight: 600 }}>{t.title}</td>
                    <td>{t.job_id ? <Link to={`/jobs/${t.job_id}`}>{t.job_number}</Link> : <span className="muted">—</span>}</td>
                    <td className="muted">{t.assignee || '—'}</td>
                    <td>
                      {t.due_date
                        ? st === 'overdue' ? <span className="badge" style={{ background: '#ef4444' }}>Overdue · {fmtDate(t.due_date)}</span>
                          : st === 'today' ? <span className="badge" style={{ background: '#f59e0b' }}>Today</span>
                          : <span className="muted">{fmtDate(t.due_date)}</span>
                        : <span className="muted">—</span>}
                    </td>
                    <td><button className="btn icon sm danger" title="Delete" onClick={() => remove(t)}><Trash2 size={14} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
