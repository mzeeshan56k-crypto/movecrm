import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { api, money, fmtDate } from '../lib/api.js';
import { Modal, Field, Empty } from '../components/ui.jsx';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [q, setQ] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [f, setF] = useState({ first_name: '', last_name: '', email: '', phone: '', company: '' });
  const [error, setError] = useState('');
  const nav = useNavigate();

  const load = () => api(`/customers?q=${encodeURIComponent(q)}`).then(setCustomers).catch(console.error);
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [q]);

  const create = async () => {
    setError('');
    try {
      const c = await api('/customers', { method: 'POST', body: f });
      nav(`/customers/${c.id}`);
    } catch (e) { setError(e.message); }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Customers</h1>
          <div className="sub">{customers.length} customers</div>
        </div>
        <div className="row">
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--muted)' }} />
            <input style={{ paddingLeft: 32, width: 240 }} placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <button className="btn primary" onClick={() => setShowNew(true)}><Plus size={16} /> New Customer</button>
        </div>
      </div>

      <div className="card">
        {customers.length === 0 ? <Empty>No customers found.</Empty> : (
          <table className="data">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Jobs</th><th>Lifetime value</th><th>Since</th></tr></thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="clickable" onClick={() => nav(`/customers/${c.id}`)}>
                  <td><b>{c.first_name} {c.last_name}</b>{c.company && <div className="muted" style={{ fontSize: 12 }}>{c.company}</div>}</td>
                  <td className="muted">{c.email || '—'}</td>
                  <td className="muted">{c.phone || '—'}</td>
                  <td>{c.job_count}</td>
                  <td><b>{money(c.lifetime_value)}</b></td>
                  <td className="muted">{fmtDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showNew && (
        <Modal title="New Customer" onClose={() => setShowNew(false)} footer={
          <>
            <button className="btn" onClick={() => setShowNew(false)}>Cancel</button>
            <button className="btn primary" onClick={create} disabled={!f.first_name}>Create</button>
          </>
        }>
          <div className="form-grid">
            <Field label="First name *"><input value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} autoFocus /></Field>
            <Field label="Last name"><input value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} /></Field>
            <Field label="Email"><input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            <Field label="Phone"><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          </div>
          <Field label="Company"><input value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></Field>
          {error && <div className="error-text">{error}</div>}
        </Modal>
      )}
    </>
  );
}
