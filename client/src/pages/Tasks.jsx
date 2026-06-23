import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { api, fmtDate } from '../lib/api.js';
import { Empty } from '../components/ui.jsx';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [assignee, setAssignee] = useState('');
  const [showDone, setShowDone] = useState(false);

  const load = () => api('/settings/tasks').then(setTasks).catch(console.error);
  useEffect(() => {
    load();
    api('/settings/users').then(setUsers).catch(() => {});
  }, []);

  const add = async () => {
    if (!title) return;
    await api('/settings/tasks', { method: 'POST', body: { title, due_date: due || null, assigned_to: assignee || null } });
    setTitle(''); setDue('');
    load();
  };

  const toggle = async (t) => {
    await api(`/settings/tasks/${t.id}`, { method: 'PUT', body: { completed: t.completed ? 0 : 1 } });
    load();
  };

  const remove = async (t) => {
    await api(`/settings/tasks/${t.id}`, { method: 'DELETE' });
    load();
  };

  const visible = tasks.filter((t) => showDone || !t.completed);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Tasks</h1>
          <div className="sub">{tasks.filter((t) => !t.completed).length} open tasks</div>
        </div>
        <label className="row" style={{ cursor: 'pointer' }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
          Show completed
        </label>
      </div>

      <div className="card">
        <div className="card-body row">
          <input style={{ flex: 2, minWidth: 200 }} placeholder="New task…" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <input type="date" style={{ width: 160 }} value={due} onChange={(e) => setDue(e.target.value)} />
          <select style={{ width: 170 }} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Assign to me</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <button className="btn primary" onClick={add}><Plus size={15} /> Add</button>
        </div>
      </div>

      <div className="card mt">
        {visible.length === 0 ? <Empty>No tasks. Enjoy the quiet!</Empty> : (
          <table className="data">
            <thead><tr><th style={{ width: 36 }} /><th>Task</th><th>Job</th><th>Assignee</th><th>Due</th><th /></tr></thead>
            <tbody>
              {visible.map((t) => (
                <tr key={t.id}>
                  <td><input type="checkbox" style={{ width: 'auto' }} checked={!!t.completed} onChange={() => toggle(t)} /></td>
                  <td style={{ textDecoration: t.completed ? 'line-through' : 'none', fontWeight: 600 }}>{t.title}</td>
                  <td>{t.job_id ? <Link to={`/jobs/${t.job_id}`}>{t.job_number}</Link> : '—'}</td>
                  <td className="muted">{t.assignee || '—'}</td>
                  <td className="muted">{t.due_date ? fmtDate(t.due_date) : '—'}</td>
                  <td><button className="btn icon sm danger" onClick={() => remove(t)}><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
