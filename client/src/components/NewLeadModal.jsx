import { useEffect, useState } from 'react';
import { api, JOB_TYPES } from '../lib/api.js';
import { Modal, Field } from './ui.jsx';

export default function NewLeadModal({ onClose, onCreated }) {
  const [moveSizes, setMoveSizes] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    type: 'local', move_date: '', move_size_id: '', lead_source_id: '',
    origin_address: '', origin_city: '', origin_state: '', origin_zip: '',
    dest_address: '', dest_city: '', dest_state: '', dest_zip: '',
    notes: '',
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    api('/settings/move-sizes').then(setMoveSizes).catch(() => {});
    api('/settings/lead-sources').then(setLeadSources).catch(() => {});
  }, []);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const job = await api('/jobs', {
        method: 'POST',
        body: {
          customer: { first_name: f.first_name, last_name: f.last_name, email: f.email, phone: f.phone },
          type: f.type,
          move_date: f.move_date || null,
          move_size_id: f.move_size_id || null,
          lead_source_id: f.lead_source_id || null,
          origin_address: f.origin_address, origin_city: f.origin_city, origin_state: f.origin_state, origin_zip: f.origin_zip,
          dest_address: f.dest_address, dest_city: f.dest_city, dest_state: f.dest_state, dest_zip: f.dest_zip,
          notes: f.notes,
        },
      });
      onCreated(job);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="New Lead"
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={submit} disabled={busy || !f.first_name}>
            {busy ? 'Creating…' : 'Create lead'}
          </button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="First name *"><input value={f.first_name} onChange={set('first_name')} /></Field>
        <Field label="Last name"><input value={f.last_name} onChange={set('last_name')} /></Field>
        <Field label="Email"><input type="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Phone"><input value={f.phone} onChange={set('phone')} /></Field>
      </div>
      <div className="form-grid-3">
        <Field label="Move type">
          <select value={f.type} onChange={set('type')}>
            {Object.entries(JOB_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="Move date"><input type="date" value={f.move_date} onChange={set('move_date')} /></Field>
        <Field label="Move size">
          <select value={f.move_size_id} onChange={set('move_size_id')}>
            <option value="">Select…</option>
            {moveSizes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Lead source">
        <select value={f.lead_source_id} onChange={set('lead_source_id')}>
          <option value="">Select…</option>
          {leadSources.filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <div className="section-title">Origin</div>
      <div className="form-grid">
        <Field label="Address"><input value={f.origin_address} onChange={set('origin_address')} /></Field>
        <Field label="City"><input value={f.origin_city} onChange={set('origin_city')} /></Field>
        <Field label="State"><input value={f.origin_state} onChange={set('origin_state')} /></Field>
        <Field label="ZIP"><input value={f.origin_zip} onChange={set('origin_zip')} /></Field>
      </div>
      <div className="section-title">Destination</div>
      <div className="form-grid">
        <Field label="Address"><input value={f.dest_address} onChange={set('dest_address')} /></Field>
        <Field label="City"><input value={f.dest_city} onChange={set('dest_city')} /></Field>
        <Field label="State"><input value={f.dest_state} onChange={set('dest_state')} /></Field>
        <Field label="ZIP"><input value={f.dest_zip} onChange={set('dest_zip')} /></Field>
      </div>
      <Field label="Notes"><textarea rows={2} value={f.notes} onChange={set('notes')} /></Field>
      {error && <div className="error-text">{error}</div>}
    </Modal>
  );
}
