import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, PhoneIncoming, PhoneOutgoing, Plus, Trash2, PhoneCall, Mic } from 'lucide-react';
import { api, fmtDateTime } from '../lib/api.js';
import { useLive } from '../lib/useLive.js';
import { Modal, Field, Empty } from '../components/ui.jsx';

const FILTERS = [{ k: 'all', label: 'All' }, { k: 'inbound', label: 'Inbound' }, { k: 'outbound', label: 'Outbound' }];

export default function Calls() {
  const [calls, setCalls] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showLog, setShowLog] = useState(false);
  const [f, setF] = useState({ direction: 'outbound', from_number: '', to_number: '', notes: '', recording_url: '' });
  const [error, setError] = useState('');
  const reqId = useRef(0);

  const load = () => {
    const id = ++reqId.current;
    return api('/calls').then((d) => { if (id === reqId.current) setCalls(d); }).catch(console.error);
  };
  useEffect(() => { load(); }, []);
  useLive(load, []); // inbound calls arrive via webhook — show them live

  const logCall = async () => {
    setError('');
    try {
      await api('/calls', { method: 'POST', body: f });
      setShowLog(false);
      setF({ direction: 'outbound', from_number: '', to_number: '', notes: '', recording_url: '' });
      load();
    } catch (e) { setError(e.message); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this call log?')) return;
    await api(`/calls/${id}`, { method: 'DELETE' });
    load();
  };

  const fmtDur = (s) => (s == null ? '—' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);

  const all = calls || [];
  const shown = filter === 'all' ? all : all.filter((c) => c.direction === filter);
  const stats = { total: all.length, inbound: all.filter((c) => c.direction === 'inbound').length, recorded: all.filter((c) => c.recording_url).length };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Calls</h1>
          <div className="sub">Inbound calls are captured & recorded automatically — set up in Settings → Lead Capture &amp; Phone</div>
        </div>
        <button className="btn primary" onClick={() => setShowLog(true)}><Plus size={16} /> Log a call</button>
      </div>

      {calls !== null && all.length > 0 && (
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(160px, 240px))' }}>
          <div className="kpi kpi-rich"><div className="kpi-icon" style={{ background: '#6366f11a', color: '#6366f1' }}><PhoneCall size={18} /></div><div><div className="label">Total calls</div><div className="value">{stats.total}</div></div></div>
          <div className="kpi kpi-rich"><div className="kpi-icon" style={{ background: '#22c55e1a', color: '#22c55e' }}><PhoneIncoming size={18} /></div><div><div className="label">Inbound</div><div className="value">{stats.inbound}</div></div></div>
          <div className="kpi kpi-rich"><div className="kpi-icon" style={{ background: '#8b5cf61a', color: '#8b5cf6' }}><Mic size={18} /></div><div><div className="label">Recorded</div><div className="value">{stats.recorded}</div></div></div>
        </div>
      )}

      <div className="card">
        {all.length > 0 && (
          <div className="card-head" style={{ gap: 6 }}>
            <div className="seg">
              {FILTERS.map((ff) => <button key={ff.k} className={filter === ff.k ? 'on' : ''} onClick={() => setFilter(ff.k)}>{ff.label}</button>)}
            </div>
            <span className="muted" style={{ fontSize: 13 }}>{shown.length} shown</span>
          </div>
        )}
        {calls === null ? (
          <table className="data">
            <thead><tr><th /><th>When</th><th>Number</th><th>Caller</th><th>Job</th><th>Duration</th><th>Recording</th><th>Notes</th><th /></tr></thead>
            <tbody>{Array.from({ length: 5 }).map((_, i) => <tr key={i}>{Array.from({ length: 9 }).map((__, k) => <td key={k}><div className="skeleton" style={{ height: 14 }} /></td>)}</tr>)}</tbody>
          </table>
        ) : shown.length === 0 ? (
          <Empty>
            {all.length === 0
              ? <>No calls yet. Connect your phone number (Settings → Lead Capture &amp; Phone) and inbound calls appear here automatically, with recordings.</>
              : <>No {filter} calls.</>}
          </Empty>
        ) : (
          <table className="data">
            <thead><tr><th /><th>When</th><th>Number</th><th>Caller</th><th>Job</th><th>Duration</th><th>Recording</th><th>Notes</th><th /></tr></thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id}>
                  <td title={c.direction}>{c.direction === 'inbound' ? <PhoneIncoming size={16} color="#22c55e" /> : <PhoneOutgoing size={16} color="#0ea5e9" />}</td>
                  <td>{fmtDateTime(c.created_at)}</td>
                  <td className="muted">{(c.direction === 'inbound' ? c.from_number : c.to_number) || '—'}</td>
                  <td>{c.first_name ? (c.customer_id ? <Link to={`/customers/${c.customer_id}`}>{c.first_name} {c.last_name}</Link> : `${c.first_name} ${c.last_name}`) : <span className="muted">—</span>}</td>
                  <td>{c.job_id ? <Link to={`/jobs/${c.job_id}`}>{c.job_number}</Link> : <span className="muted">—</span>}</td>
                  <td>{fmtDur(c.duration_seconds)}</td>
                  <td>
                    {c.recording_url
                      ? <audio controls preload="none" src={c.recording_url} style={{ height: 32, maxWidth: 220 }} />
                      : <span className="muted">{c.status === 'received' ? 'processing…' : '—'}</span>}
                  </td>
                  <td className="muted" style={{ maxWidth: 220, fontSize: 12 }}>{c.notes || ''}</td>
                  <td><button className="btn icon sm danger" title="Delete" onClick={() => remove(c.id)}><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showLog && (
        <Modal title="Log a call" onClose={() => setShowLog(false)} footer={
          <>
            <button className="btn" onClick={() => setShowLog(false)}>Cancel</button>
            <button className="btn primary" onClick={logCall}>Save</button>
          </>
        }>
          <div className="form-grid">
            <Field label="Direction">
              <select value={f.direction} onChange={(e) => setF((p) => ({ ...p, direction: e.target.value }))}>
                <option value="outbound">Outbound (we called them)</option>
                <option value="inbound">Inbound (they called us)</option>
              </select>
            </Field>
            <Field label={f.direction === 'inbound' ? 'Their number' : 'Number called'}>
              <input value={f.direction === 'inbound' ? f.from_number : f.to_number}
                onChange={(e) => setF((p) => (f.direction === 'inbound' ? { ...p, from_number: e.target.value } : { ...p, to_number: e.target.value }))} />
            </Field>
          </div>
          <Field label="Notes"><textarea rows={3} value={f.notes} onChange={(e) => setF((p) => ({ ...p, notes: e.target.value }))} /></Field>
          <Field label="Recording link (optional)"><input value={f.recording_url} onChange={(e) => setF((p) => ({ ...p, recording_url: e.target.value }))} placeholder="https://…" /></Field>
          {error && <div className="error-text">{error}</div>}
        </Modal>
      )}
    </>
  );
}
