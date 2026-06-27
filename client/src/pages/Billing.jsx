import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Crown, Clock, Shield } from 'lucide-react';
import { api, money } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';

const PLAN_OPTIONS = ['trial', 'starter', 'growth', 'pro', 'enterprise', 'owner'];

function OwnerAdmin() {
  const [orgs, setOrgs] = useState(null);
  const [saving, setSaving] = useState(null);
  const load = () => api('/subscription/orgs').then(setOrgs).catch(() => setOrgs([]));
  useEffect(() => { load(); }, []);
  if (!orgs) return null;

  const setPlan = async (id, plan) => {
    setSaving(id);
    try { await api(`/subscription/orgs/${id}/plan`, { method: 'POST', body: { plan } }); await load(); }
    catch (e) { alert(e.message); }
    finally { setSaving(null); }
  };

  return (
    <div className="card mt">
      <div className="card-head"><span className="row" style={{ gap: 8 }}><Shield size={16} /> Owner admin — all companies ({orgs.length})</span></div>
      <table className="data">
        <thead><tr><th>Company</th><th>Admin email</th><th>Sites</th><th>Users</th><th>Plan</th></tr></thead>
        <tbody>
          {orgs.map((o) => (
            <tr key={o.id}>
              <td><b>{o.name}</b></td>
              <td className="muted">{o.admin_email}</td>
              <td>{o.websites}</td>
              <td>{o.users}</td>
              <td>
                <select value={o.plan} disabled={saving === o.id} onChange={(e) => setPlan(o.id, e.target.value)} style={{ width: 140 }}>
                  {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="card-body" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          After a customer pays (Payoneer / Lemon Squeezy / Paddle), set their plan here to activate it instantly.
        </p>
      </div>
    </div>
  );
}

export default function Billing() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    api('/subscription').then(setData).catch(console.error);
    if (params.get('upgraded')) {
      setNotice('🎉 Your plan upgrade is being activated — it’ll update here shortly.');
      params.delete('upgraded');
      setParams(params, { replace: true });
    }
  }, []);

  const subscribe = async (plan) => {
    setBusy(plan);
    setNotice('');
    try {
      const res = await api('/subscription/subscribe', { method: 'POST', body: { plan } });
      if (res.url && res.external) {
        window.open(res.url, '_blank', 'noopener');
        setNotice('Opened secure checkout in a new tab. Once your payment is confirmed, your plan is activated — usually within a few hours.');
      } else if (res.url) {
        window.location.href = res.url;
      }
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy('');
    }
  };

  const manage = async () => {
    try {
      const res = await api('/subscription/portal', { method: 'POST' });
      if (res.url) window.location.href = res.url;
    } catch (e) { setNotice(e.message); }
  };

  if (!data) return <div className="empty">Loading…</div>;
  const isAdmin = user?.role === 'admin';
  const currentKey = data.current.key;
  const onPaid = ['starter', 'growth', 'pro'].includes(currentKey);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Plans & Billing</h1>
          <div className="sub">
            Current plan: <b>{data.current.label}</b>
            {data.current.renews_at ? ` · renews ${new Date(data.current.renews_at).toLocaleDateString()}` : ''}
          </div>
        </div>
        {onPaid && data.stripe_enabled && <button className="btn" onClick={manage}>Manage subscription</button>}
      </div>

      {currentKey === 'owner' && (
        <div className="card" style={{ marginBottom: 18, borderColor: '#f59e0b' }}>
          <div className="card-body row" style={{ gap: 10 }}>
            <Crown size={20} color="#f59e0b" />
            <div><b>Platform owner</b> — you have unlimited access to everything, free, forever.</div>
          </div>
        </div>
      )}

      {currentKey === 'trial' && (
        <div className="card" style={{ marginBottom: 18, borderColor: data.current.trial_days_left === 0 ? 'var(--danger)' : 'var(--primary)' }}>
          <div className="card-body row" style={{ gap: 10 }}>
            <Clock size={20} color={data.current.trial_days_left === 0 ? '#ef4444' : '#2563eb'} />
            <div>
              {data.current.trial_days_left > 0
                ? <><b>{data.current.trial_days_left} day{data.current.trial_days_left === 1 ? '' : 's'} left</b> in your free trial. Choose a plan below to keep things running after it ends.</>
                : <><b>Your free trial has ended.</b> Choose a plan below to continue using all features.</>}
            </div>
          </div>
        </div>
      )}

      {notice && <div className="card" style={{ marginBottom: 18 }}><div className="card-body">{notice}</div></div>}

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-body row spread">
          <div><b>{data.usage.websites}</b> of {data.current.websites_limit} lead-capture websites used</div>
          <div><b>{data.usage.users}</b> of {data.current.users_limit} team members used</div>
        </div>
      </div>

      <div className="board" style={{ gridTemplateColumns: `repeat(${data.plans.length}, 1fr)` }}>
        {data.plans.map((p) => {
          const isCurrent = p.key === currentKey;
          const recommended = p.key === 'growth';
          return (
            <div key={p.key} className="card" style={{ borderColor: isCurrent || recommended ? 'var(--primary)' : undefined, borderWidth: isCurrent || recommended ? 2 : 1, position: 'relative' }}>
              {recommended && !isCurrent && (
                <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 999 }}>POPULAR</div>
              )}
              <div className="card-body">
                <h3 style={{ fontSize: 18 }}>{p.label}</h3>
                <div style={{ fontSize: 30, fontWeight: 800, margin: '6px 0' }}>
                  {p.contact ? 'Custom' : <>{money(p.price)}<span className="muted" style={{ fontSize: 14, fontWeight: 500 }}>/mo</span></>}
                </div>
                <div className="muted" style={{ minHeight: 36 }}>{p.blurb}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0' }}>
                  {p.features.map((f) => (
                    <li key={f} style={{ display: 'flex', flexWrap: 'nowrap', gap: 8, padding: '4px 0', alignItems: 'flex-start' }}>
                      <Check size={15} color="#22c55e" style={{ flexShrink: 0, marginTop: 2 }} /> <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <button className="btn" style={{ width: '100%', justifyContent: 'center' }} disabled>Current plan</button>
                ) : p.contact ? (
                  <a className="btn" style={{ width: '100%', justifyContent: 'center' }}
                    href={`mailto:${data.support_email}?subject=Enterprise%20plan%20enquiry`}>Contact sales</a>
                ) : (
                  <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }}
                    disabled={!isAdmin || busy === p.key} onClick={() => subscribe(p.key)}>
                    {busy === p.key ? 'Starting…' : `Choose ${p.label}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!data.payments_enabled && currentKey !== 'owner' && (
        <p className="muted mt" style={{ fontSize: 13 }}>
          Note: online payment isn’t connected yet. Choosing a plan will ask you to contact us to activate it —
          we’ll switch on self-serve checkout soon.
        </p>
      )}

      {data.is_owner && <OwnerAdmin />}
    </>
  );
}
