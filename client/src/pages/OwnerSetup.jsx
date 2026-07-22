import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, ShieldCheck } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';

// The platform owner never signs up. Their email is pre-designated on the server
// (OWNER_EMAIL); here they simply set a password one time, then log in from then on.
export default function OwnerSetup() {
  const { ownerStatus, ownerSetup } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null); // { configured, claimed, email }
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    ownerStatus()
      .then(setStatus)
      .catch(() => setStatus({ configured: false }));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirm) return setError('Passwords do not match');
    setBusy(true);
    try {
      await ownerSetup(password);
      navigate('/');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const card = (children) => (
    <div className="login-page">
      <div className="login-card">
        <div className="logo"><Truck size={26} color="#2563eb" /> Movers CRM</div>
        {children}
      </div>
    </div>
  );

  if (!status) return card(<p className="muted" style={{ marginTop: 0 }}>Checking owner access…</p>);

  if (!status.configured) {
    return card(
      <>
        <p className="muted" style={{ marginTop: 0 }}>
          Owner access isn’t configured on this server. Set an <code>OWNER_EMAIL</code> environment
          variable to enable one-time owner setup.
        </p>
        <p className="muted" style={{ fontSize: 13, marginTop: 16, textAlign: 'center' }}>
          <Link to="/login">Back to sign in</Link>
        </p>
      </>
    );
  }

  if (status.claimed) {
    return card(
      <>
        <p style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
          <ShieldCheck size={18} color="#22c55e" /> Owner account is ready
        </p>
        <p className="muted" style={{ marginTop: 4 }}>
          Your password is already set. Just sign in with your owner email.
        </p>
        <Link to="/login" className="btn primary" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
          Go to sign in
        </Link>
      </>
    );
  }

  return card(
    <form onSubmit={submit}>
      <p style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
        <ShieldCheck size={18} color="#2563eb" /> Set your owner password
      </p>
      <p className="muted" style={{ marginTop: 4 }}>
        Welcome, owner. No signup needed. Just choose a password once for your
        configured owner email, then you can log in any time.
      </p>
      <label className="field">
        <span>New password</span>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required autoFocus />
      </label>
      <label className="field">
        <span>Confirm password</span>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={6} required />
      </label>
      {error && <div className="error-text">{error}</div>}
      <button className="btn primary" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }} disabled={busy}>
        {busy ? 'Setting up…' : 'Set password & sign in'}
      </button>
      <p className="muted" style={{ fontSize: 13, marginTop: 16, textAlign: 'center' }}>
        Already set up? <Link to="/login">Sign in</Link>
      </p>
    </form>
  );
}
