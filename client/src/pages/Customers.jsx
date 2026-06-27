import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import { api, money, fmtDate } from '../lib/api.js';
import { useLive } from '../lib/useLive.js';
import { Modal, Field, Empty } from '../components/ui.jsx';

export default function Customers() {
  const [customers, setCustomers] = useState(null);
  const [q, setQ] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [f, setF] = useState({ first_name: '', last_name: '', email: '', phone: '', company: '' });
  const [error, setError] = useState('');
  const reqId = useRef(0);
  const nav = useNavigate();

  const load = () => {
    const id = ++reqId.current;
    return api(`/customers?q=${encodeURIComponent(q)}`)
      .then((d) => { if (id === reqId.current) setCustomers(d); })
      .catch(console.error);
  };
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [q]);
  useLive(load, [q]);

  const create = async () => {
    setError('');
    try {
      const c = await api('/customers', { method: 'POST', body: f });
      nav(`/customers/${c.id}`);
    } catch (e) { setError(e.message); }
  };

  const count = customers?.length ?? 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Customers</h1>
          <div className="sub">{customers === null ? 'Loading…' : `${count} ${q ? 'matching ' : ''}customer${count === 1 ? '' : 's'}`}</div>
        </div>
        <div className="row">
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--muted)' }} />
            <input style={{ paddingLeft: 32, paddingRight: 28, width: 240 }} placeholder="Search name, email, phone…" value={q} onChange={(e) => setQ(e.target.value)} />
            {q && <button className="icon-clear" onClick={() => setQ('')} aria-label="Clear search"><X size={14} /></button>}
          </div>
          <button className="btn primary" onClick={() => setShowNew(true)}><Plus size={16} /> New Customer</button>
        </div>
      </div>

      <div className="card">
        {customers === null ? (
          <table className="data">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Jobs</th><th>Lifetime value</th><th>Since</th></tr></thead>
            <tbody>{Array.from({ length: 6 }).map((_, i) => <tr key={i}>{Array.from({ length: 6 }).map((__, k) => <td key={k}><div className="skeleton" style={{ height: 14 }} /></td>)}</tr>)}</tbody>
          </table>
        ) : count === 0 ? (
          <Empty>
            {q
              ? <>No customers match “{q}”. <button className="btn sm" style={{ marginLeft: 8 }} onClick={() => setQ('')}>Clear search</button></>
              : <>No customers yet. <button className="btn sm primary" style={{ marginLeft: 8 }} onClick={() => setShowNew(true)}><Plus size={14} /> Add your first customer</button></>}
          </Empty>
        ) : (
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
