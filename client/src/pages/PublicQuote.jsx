import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Truck, CheckCircle } from 'lucide-react';

// Public quote-request form. No login — this is what a moving company's website
// visitors see. Submissions become leads in that company's CRM automatically.
export default function PublicQuote() {
  const { publicKey } = useParams();
  const [org, setOrg] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    move_date: '', move_size: '', origin_city: '', dest_city: '', message: '',
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    fetch(`/api/public/org/${publicKey}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setOrg)
      .catch(() => setNotFound(true));
  }, [publicKey]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/public/lead/${publicKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, notes: f.message, source: 'Website Form' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setDone(data);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (notFound) return <div className="login-page"><div className="login-card">This quote link is not valid.</div></div>;
  if (!org) return <div className="login-page"><div className="login-card">Loading…</div></div>;

  if (done) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <CheckCircle size={48} color="#22c55e" style={{ margin: '0 auto 12px' }} />
          <h2>Request received!</h2>
          <p className="muted">{done.message}</p>
          <p className="muted" style={{ fontSize: 13 }}>Your reference number: <b>{done.reference}</b></p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page" style={{ padding: '40px 16px', alignItems: 'flex-start' }}>
      <form className="login-card" style={{ width: 520 }} onSubmit={submit}>
        <div className="logo"><Truck size={26} color="#2563eb" /> {org.company_name}</div>
        <p className="muted" style={{ marginTop: 0 }}>Get your free moving quote — we'll contact you within one business day.</p>

        <div className="form-grid">
          <label className="field"><span>First name *</span><input value={f.first_name} onChange={set('first_name')} required /></label>
          <label className="field"><span>Last name</span><input value={f.last_name} onChange={set('last_name')} /></label>
          <label className="field"><span>Phone *</span><input value={f.phone} onChange={set('phone')} required /></label>
          <label className="field"><span>Email</span><input type="email" value={f.email} onChange={set('email')} /></label>
          <label className="field"><span>Preferred move date</span><input type="date" value={f.move_date} onChange={set('move_date')} /></label>
          <label className="field">
            <span>Home size</span>
            <select value={f.move_size} onChange={set('move_size')}>
              <option value="">Select…</option>
              {org.move_sizes.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
          </label>
          <label className="field"><span>Moving from (city)</span><input value={f.origin_city} onChange={set('origin_city')} /></label>
          <label className="field"><span>Moving to (city)</span><input value={f.dest_city} onChange={set('dest_city')} /></label>
        </div>
        <label className="field"><span>Anything else we should know?</span><textarea rows={3} value={f.message} onChange={set('message')} /></label>

        {error && <div className="error-text">{error}</div>}
        <button className="btn primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={busy}>
          {busy ? 'Sending…' : 'Request my free quote'}
        </button>
      </form>
    </div>
  );
}
