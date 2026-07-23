import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Truck, CheckCircle, ArrowLeft } from 'lucide-react';

const SERVICE_TYPES = [
  { value: 'local', label: 'Local Move' },
  { value: 'long_distance', label: 'Long Distance' },
  { value: 'commercial', label: 'Commercial / Office' },
  { value: 'storage', label: 'Storage' },
  { value: 'labor_only', label: 'Labor Only' },
];

// Public quote-request form. No login — this is what a moving company's website
// visitors see. Submissions become leads in that company's CRM automatically.
export default function PublicQuote() {
  const { publicKey } = useParams();
  // When embedded on a company's website (?embed=1), the form drops its full-page
  // background and sizes to its content so it blends into the host page instead
  // of taking over the whole iframe.
  const embed = new URLSearchParams(window.location.search).get('embed') === '1';
  const pageClass = 'quote-page' + (embed ? ' embed' : '');
  const [org, setOrg] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(1);
  const [f, setF] = useState({
    origin_city: '', dest_city: '', move_date: '', type: '', move_size: '',
    first_name: '', last_name: '', phone: '', email: '', message: '',
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    fetch(`/api/public/org/${publicKey}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setOrg)
      .catch(() => setNotFound(true));
  }, [publicKey]);

  const step1Valid = f.origin_city && f.dest_city && f.move_date;
  const step2Valid = f.first_name && f.phone;

  const submit = async () => {
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

  if (notFound) return <div className={pageClass}><div className="quote-card">This quote link is not valid.</div></div>;
  if (!org) return <div className={pageClass}><div className="quote-card">Loading…</div></div>;

  if (done) {
    return (
      <div className={pageClass}>
        <div className="quote-card" style={{ textAlign: 'center' }}>
          <CheckCircle size={52} color="#22c55e" style={{ margin: '0 auto 14px' }} />
          <h2 style={{ fontSize: 22 }}>Request received!</h2>
          <p className="muted">{done.message}</p>
          <p className="muted" style={{ fontSize: 13 }}>Reference number: <b>{done.reference}</b></p>
        </div>
      </div>
    );
  }

  return (
    <div className={pageClass}>
      <div className="quote-card">
        <div className="quote-head">
          <div className="quote-logo"><Truck size={24} /> {org.company_name}</div>
          <h2>Get a Free Estimate</h2>
          <p>Get a customized moving quote with no obligation. Request your free estimate today.</p>
        </div>

        <div className="quote-steps">
          <div className="quote-progress"><div style={{ width: step === 1 ? '50%' : '100%' }} /></div>
          <span>STEP {step} OF 2</span>
        </div>

        {step === 1 ? (
          <>
            <div className="quote-grid">
              <label className="field"><span>Moving From *</span><input value={f.origin_city} onChange={set('origin_city')} placeholder="City or ZIP" /></label>
              <label className="field"><span>Moving To *</span><input value={f.dest_city} onChange={set('dest_city')} placeholder="City or ZIP" /></label>
            </div>
            <label className="field"><span>Move Date *</span><input type="date" value={f.move_date} onChange={set('move_date')} /></label>
            <div className="quote-grid">
              <label className="field">
                <span>Service Type</span>
                <select value={f.type} onChange={set('type')}>
                  <option value="">Select…</option>
                  {SERVICE_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Moving Size</span>
                <select value={f.move_size} onChange={set('move_size')}>
                  <option value="">Select…</option>
                  {org.move_sizes.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </label>
            </div>
            <button className="quote-btn" disabled={!step1Valid} onClick={() => setStep(2)}>Next</button>
          </>
        ) : (
          <>
            <div className="quote-grid">
              <label className="field"><span>First Name *</span><input value={f.first_name} onChange={set('first_name')} autoFocus /></label>
              <label className="field"><span>Last Name</span><input value={f.last_name} onChange={set('last_name')} /></label>
            </div>
            <div className="quote-grid">
              <label className="field"><span>Phone *</span><input value={f.phone} onChange={set('phone')} /></label>
              <label className="field"><span>Email</span><input type="email" value={f.email} onChange={set('email')} /></label>
            </div>
            <label className="field"><span>Anything else we should know?</span><textarea rows={3} value={f.message} onChange={set('message')} /></label>
            {error && <div className="error-text">{error}</div>}
            <div className="quote-actions">
              <button className="quote-btn ghost" onClick={() => setStep(1)}><ArrowLeft size={16} /> Back</button>
              <button className="quote-btn" disabled={!step2Valid || busy} onClick={submit}>
                {busy ? 'Sending…' : 'Get My Free Quote'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
