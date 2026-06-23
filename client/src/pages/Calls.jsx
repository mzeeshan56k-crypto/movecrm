import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, PhoneIncoming, PhoneOutgoing, Plus } from 'lucide-react';
import { api, fmtDateTime } from '../lib/api.js';
import { Modal, Field, Empty } from '../components/ui.jsx';

export default function Calls() {
  const [calls, setCalls] = useState([]);
  const [showLog, setShowLog] = useState(false);
  const [f, setF] = useState({ direction: 'outbound', from_number: '', to_number: '', notes: '', recording_url: '' });
  const [error, setError] = useState('');

  const load = () => api('/calls').then(setCalls).catch(console.error);
  useEffect(() => { load(); }, []);

  const logCall = async () => {
    setError('');
    try {
      await api('/calls', { method: 'POST', body: f });
      setShowLog(false);
      setF({ direction: 'outbound', from_number: '', to_number: '', notes: '', recording_url: '' });
      load();
    } catch (e) { setError(e.message); }
  };

  const fmtDur = (s) => (s == null ? '—' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Calls</h1>
          <div className="sub">
            Inbound calls to your business number are captured and recorded automatically — set this up in Settings → Lead Capture & Phone
          </div>
        </div>
        <button className="btn primary" onClick={() => setShowLog(true)}><Plus size={16} /> Log a call</button>
      </div>

      <div className="card">
        {calls.length === 0 ? (
          <Empty>
            No calls yet. Connect your phone number (Settings → Lead Capture &amp; Phone) and inbound
            calls will appear here automatically, with recordings.
          </Empty>
        ) : (
          <table className="data">
            <thead><tr><th /><th>When</th><th>From / To</th><th>Caller</th><th>Job</th><th>Duration</th><th>Recording</th><th>Notes</th></tr></thead>
            <tbody>
              {calls.map((c) => (
                <tr key={c.id}>
                  <td>{c.direction === 'inbound' ? <PhoneIncoming size={16} color="#22c55e" /> : <PhoneOutgoing size={16} color="#0ea5e9" />}</td>
                  <td>{fmtDateTime(c.created_at)}</td>
                  <td className="muted">{c.direction === 'inbound' ? c.from_number : c.to_number || '—'}</td>
                  <td>{c.first_name ? `${c.first_name} ${c.last_name}` : '—'}</td>
                  <td>{c.job_id ? <Link to={`/jobs/${c.job_id}`}>{c.job_number}</Link> : '—'}</td>
                  <td>{fmtDur(c.duration_seconds)}</td>
                  <td>
                    {c.recording_url
                      ? <audio controls src={c.recording_url} style={{ height: 32, maxWidth: 220 }} />
                      : <span className="muted">{c.status === 'received' ? 'processing…' : '—'}</span>}
                  </td>
                  <td className="muted">{c.notes || ''}</td>
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
