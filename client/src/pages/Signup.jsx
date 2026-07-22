import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';

export default function Signup() {
  const { signup } = useAuth();
  const [f, setF] = useState({ company_name: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signup(f);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="logo"><Truck size={26} color="#2563eb" /> Move CRM</div>
        <p className="muted" style={{ marginTop: 0 }}>Start your moving company workspace — free.</p>

        <label className="field">
          <span>Company name</span>
          <input value={f.company_name} onChange={set('company_name')} placeholder="Acme Moving Co." required autoFocus />
        </label>
        <label className="field">
          <span>Your name</span>
          <input value={f.name} onChange={set('name')} required />
        </label>
        <label className="field">
          <span>Work email</span>
          <input type="email" value={f.email} onChange={set('email')} required />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" value={f.password} onChange={set('password')} minLength={6} required />
        </label>
        <p className="muted" style={{ fontSize: 12, marginTop: -4 }}>
          Free for one company. No credit card required.
        </p>

        {error && <div className="error-text">{error}</div>}
        <button className="btn primary" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }} disabled={busy}>
          {busy ? 'Creating your workspace…' : 'Create account'}
        </button>
        <p className="muted" style={{ fontSize: 13, marginTop: 16, textAlign: 'center' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
