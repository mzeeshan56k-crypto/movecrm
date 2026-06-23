import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Save } from 'lucide-react';
import { api } from '../lib/api.js';
import { Field, Modal } from '../components/ui.jsx';
import { useAuth } from '../lib/auth.jsx';

const TABS = ['Company', 'Lead Capture & Phone', 'Lead Sources', 'Move Sizes', 'Services', 'Crew', 'Trucks', 'Users', 'Email Templates'];

export default function Settings() {
  const [tab, setTab] = useState('Company');
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <div className="sub">{isAdmin ? 'Configure your company workspace' : 'Read-only — ask an admin to make changes'}</div>
        </div>
      </div>
      <div className="tabs">
        {TABS.map((t) => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {tab === 'Company' && <Company isAdmin={isAdmin} />}
      {tab === 'Lead Capture & Phone' && <LeadCapture />}
      {tab === 'Lead Sources' && (
        <SimpleCrud path="/settings/lead-sources" isAdmin={isAdmin} fields={[
          { key: 'name', label: 'Name' },
          { key: 'active', label: 'Active', type: 'checkbox' },
        ]} />
      )}
      {tab === 'Move Sizes' && (
        <SimpleCrud path="/settings/move-sizes" isAdmin={isAdmin} fields={[
          { key: 'name', label: 'Name' },
          { key: 'cubic_feet', label: 'Cubic feet', type: 'number' },
          { key: 'est_hours', label: 'Est. hours', type: 'number' },
          { key: 'est_movers', label: 'Est. movers', type: 'number' },
        ]} />
      )}
      {tab === 'Services' && (
        <SimpleCrud path="/settings/services" isAdmin={isAdmin} fields={[
          { key: 'name', label: 'Name' },
          { key: 'rate_type', label: 'Rate type', type: 'select', options: ['hourly', 'flat', 'per_unit', 'percent'] },
          { key: 'rate', label: 'Rate ($)', type: 'number' },
          { key: 'active', label: 'Active', type: 'checkbox' },
        ]} />
      )}
      {tab === 'Crew' && (
        <SimpleCrud path="/resources/crew" isAdmin={true} fields={[
          { key: 'name', label: 'Name' },
          { key: 'role', label: 'Role', type: 'select', options: ['foreman', 'driver', 'mover'] },
          { key: 'phone', label: 'Phone' },
          { key: 'hourly_wage', label: 'Hourly wage ($)', type: 'number' },
          { key: 'active', label: 'Active', type: 'checkbox' },
        ]} />
      )}
      {tab === 'Trucks' && (
        <SimpleCrud path="/resources/trucks" isAdmin={true} fields={[
          { key: 'name', label: 'Name' },
          { key: 'capacity_cuft', label: 'Capacity (cu ft)', type: 'number' },
          { key: 'status', label: 'Status', type: 'select', options: ['available', 'maintenance', 'retired'] },
        ]} />
      )}
      {tab === 'Users' && <UsersTab isAdmin={isAdmin} />}
      {tab === 'Email Templates' && <Templates isAdmin={isAdmin} />}
    </>
  );
}

function LeadCapture() {
  const [websites, setWebsites] = useState(null);
  const [baseUrl, setBaseUrl] = useState(window.location.origin);
  const [copied, setCopied] = useState('');
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');

  const load = () => api('/websites').then(setWebsites).catch(console.error);
  useEffect(() => {
    load();
    api('/account/status').then((s) => { if (s.public_base_url) setBaseUrl(s.public_base_url); }).catch(() => {});
  }, []);
  if (!websites) return <div className="empty">Loading…</div>;

  const origin = baseUrl;
  const copy = (label, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(''), 1500);
    });
  };
  const CopyBtn = ({ label, text }) => (
    <button className="btn sm" onClick={() => copy(label, text)}>{copied === label ? 'Copied!' : 'Copy'}</button>
  );
  const Code = ({ children }) => (
    <code style={{ display: 'block', background: '#f1f5f9', padding: '10px 12px', borderRadius: 8, fontSize: 12, wordBreak: 'break-all', marginTop: 6 }}>{children}</code>
  );

  const addWebsite = async () => {
    setError('');
    try {
      await api('/websites', { method: 'POST', body: { name: newName || 'New Website' } });
      setNewName('');
      load();
    } catch (e) { setError(e.message); }
  };

  // Phone/voice uses the first website's key.
  const voiceKey = websites[0]?.public_key;
  const voiceUrl = `${origin}/api/public/voice/${voiceKey}`;

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="card">
        <div className="card-head">
          🌐 Your lead-capture websites
          <div className="row" style={{ gap: 6 }}>
            <input placeholder="New website name…" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ width: 170 }} />
            <button className="btn primary sm" onClick={addWebsite}>+ Add</button>
          </div>
        </div>
        <div className="card-body">
          {error && <div className="error-text" style={{ marginBottom: 10 }}>{error}{/upgrade|plan/i.test(error) && <> — <Link to="/billing">see plans</Link></>}</div>}
          <p className="muted" style={{ marginTop: 0 }}>
            Each website has its own quote form and links. Share them anywhere — every submission becomes a
            lead automatically.
          </p>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 12 }}>
            💡 <b>Embedding on your website?</b> Use the links below exactly as shown (they use your live
            address). If a form ever says “refused to connect”, you copied a temporary preview link —
            always copy from this page on your real site address.
          </div>
          {websites.map((w) => {
            const formUrl = `${origin}/quote/${w.public_key}`;
            const apiUrl = `${origin}/api/public/lead/${w.public_key}`;
            const embed = `<iframe src="${formUrl}" style="width:100%;height:760px;border:none;border-radius:12px"></iframe>`;
            return (
              <div key={w.id} className="card" style={{ marginBottom: 12 }}>
                <div className="card-head">{w.name}</div>
                <div className="card-body">
                  <div className="section-title" style={{ marginTop: 0 }}>Quote form link</div>
                  <div className="row spread"><Code>{formUrl}</Code><CopyBtn label={`f${w.id}`} text={formUrl} /></div>
                  <div className="section-title">Embed on your website</div>
                  <div className="row spread"><Code>{embed}</Code><CopyBtn label={`e${w.id}`} text={embed} /></div>
                  <div className="section-title">Webhook (Zapier / lead providers)</div>
                  <div className="row spread"><Code>{apiUrl}</Code><CopyBtn label={`w${w.id}`} text={apiUrl} /></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card mt">
        <div className="card-head">📞 Phone calls — auto-capture &amp; recording</div>
        <div className="card-body">
          <p className="muted" style={{ marginTop: 0 }}>
            Connect a business phone number and every inbound call is answered with a greeting,
            <b> recorded</b>, and logged in your <b>Calls</b> page — new callers automatically become
            leads. This uses Twilio (the phone provider SmartMoving and most CRMs use):
          </p>
          <ol style={{ paddingLeft: 18, lineHeight: 1.9 }}>
            <li>Create a free account at <b>twilio.com</b> (new accounts get free trial credit)</li>
            <li>Buy a phone number (Phone Numbers → Buy a Number — covered by trial credit)</li>
            <li>Open the number → under <b>Voice Configuration</b>, set <b>"A call comes in"</b> to <b>Webhook</b>, method <b>HTTP POST</b>, and paste this URL:</li>
          </ol>
          <div className="row spread">
            <Code>{voiceUrl}</Code>
            <CopyBtn label="voice" text={voiceUrl} />
          </div>
          <p className="muted" style={{ marginBottom: 0 }}>
            That's it — call your new number to test. The call, the recording, and a new lead will
            appear in the CRM within seconds. (A number costs about $1/month after trial credit.)
          </p>
        </div>
      </div>
    </div>
  );
}

function Company({ isAdmin }) {
  const [s, setS] = useState({});
  const [saved, setSaved] = useState(false);
  useEffect(() => { api('/settings/company').then(setS).catch(console.error); }, []);
  const set = (k) => (e) => setS((p) => ({ ...p, [k]: e.target.value }));
  const save = async () => {
    await api('/settings/company', { method: 'PUT', body: s });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };
  return (
    <div className="card" style={{ maxWidth: 620 }}>
      <div className="card-head">Company profile</div>
      <div className="card-body">
        <Field label="Company name"><input value={s.company_name || ''} onChange={set('company_name')} disabled={!isAdmin} /></Field>
        <div className="form-grid">
          <Field label="Phone"><input value={s.company_phone || ''} onChange={set('company_phone')} disabled={!isAdmin} /></Field>
          <Field label="Email"><input value={s.company_email || ''} onChange={set('company_email')} disabled={!isAdmin} /></Field>
        </div>
        <Field label="Address"><input value={s.company_address || ''} onChange={set('company_address')} disabled={!isAdmin} /></Field>
        <Field label="Default tax rate (%)"><input type="number" step="0.01" value={s.default_tax_rate || ''} onChange={set('default_tax_rate')} disabled={!isAdmin} /></Field>
        {isAdmin && <button className="btn primary" onClick={save}><Save size={15} /> {saved ? 'Saved!' : 'Save'}</button>}
      </div>
      {isAdmin && <DangerZone />}
    </div>
  );
}

function DangerZone() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const reset = async () => {
    if (!window.confirm('This permanently deletes ALL customers, jobs, invoices, calls and reviews in your workspace. Your settings, pricing, crew and team stay. Continue?')) return;
    if (!window.confirm('Are you absolutely sure? This cannot be undone.')) return;
    setBusy(true);
    try {
      await api('/account/reset', { method: 'POST' });
      setDone(true);
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };
  return (
    <div style={{ borderTop: '1px solid var(--border)', padding: 18 }}>
      <div className="section-title" style={{ color: 'var(--danger)', marginTop: 0 }}>Danger zone</div>
      <p className="muted" style={{ marginTop: 0 }}>
        Clear all test data to start fresh before launch. Deletes customers, jobs, invoices, calls and reviews —
        keeps your company settings, pricing, crew and team.
      </p>
      {done
        ? <span style={{ color: '#22c55e', fontWeight: 600 }}>✓ Workspace cleared. Reload to see your fresh start.</span>
        : <button className="btn danger" onClick={reset} disabled={busy}><Trash2 size={15} /> {busy ? 'Clearing…' : 'Reset workspace data'}</button>}
    </div>
  );
}

function SimpleCrud({ path, fields, isAdmin }) {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null); // null | {} (new) | row
  const [error, setError] = useState('');

  const load = () => api(path).then(setRows).catch(console.error);
  useEffect(() => { load(); }, [path]);

  const save = async () => {
    setError('');
    try {
      const body = {};
      for (const f of fields) {
        let v = editing[f.key];
        if (f.type === 'checkbox') v = v ? 1 : 0;
        if (f.type === 'number') v = Number(v) || 0;
        body[f.key] = v ?? (f.type === 'checkbox' ? 1 : '');
      }
      if (editing.id) await api(`${path}/${editing.id}`, { method: 'PUT', body });
      else await api(path, { method: 'POST', body });
      setEditing(null);
      load();
    } catch (e) { setError(e.message); }
  };

  const remove = async (row) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api(`${path}/${row.id}`, { method: 'DELETE' });
      load();
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="card">
      <div className="card-head">
        {rows.length} items
        {isAdmin && <button className="btn primary sm" onClick={() => setEditing({ active: 1, status: 'available', role: 'mover', rate_type: 'flat' })}><Plus size={14} /> Add</button>}
      </div>
      <table className="data">
        <thead>
          <tr>{fields.map((f) => <th key={f.key}>{f.label}</th>)}{isAdmin && <th />}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              {fields.map((f) => (
                <td key={f.key}>
                  {f.type === 'checkbox' ? (r[f.key] ? '✓' : '—') : f.key === 'name' ? <b>{r[f.key]}</b> : String(r[f.key] ?? '—')}
                </td>
              ))}
              {isAdmin && (
                <td style={{ textAlign: 'right' }}>
                  <button className="btn sm" onClick={() => setEditing(r)}>Edit</button>{' '}
                  <button className="btn icon sm danger" onClick={() => remove(r)}><Trash2 size={14} /></button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {editing && (
        <Modal title={editing.id ? 'Edit' : 'Add'} onClose={() => setEditing(null)} footer={
          <>
            <button className="btn" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn primary" onClick={save}>Save</button>
          </>
        }>
          {fields.map((f) => (
            <Field key={f.key} label={f.label}>
              {f.type === 'select' ? (
                <select value={editing[f.key] ?? f.options[0]} onChange={(e) => setEditing((p) => ({ ...p, [f.key]: e.target.value }))}>
                  {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === 'checkbox' ? (
                <input type="checkbox" style={{ width: 'auto' }} checked={!!editing[f.key]} onChange={(e) => setEditing((p) => ({ ...p, [f.key]: e.target.checked ? 1 : 0 }))} />
              ) : (
                <input type={f.type || 'text'} value={editing[f.key] ?? ''} onChange={(e) => setEditing((p) => ({ ...p, [f.key]: e.target.value }))} />
              )}
            </Field>
          ))}
          {error && <div className="error-text">{error}</div>}
        </Modal>
      )}
    </div>
  );
}

function UsersTab({ isAdmin }) {
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = () => api('/settings/users').then(setUsers).catch(console.error);
  useEffect(() => { load(); }, []);

  const save = async () => {
    setError('');
    try {
      const body = { name: editing.name, email: editing.email, role: editing.role, active: editing.active ?? 1 };
      if (editing.password) body.password = editing.password;
      if (editing.id) await api(`/settings/users/${editing.id}`, { method: 'PUT', body });
      else await api('/settings/users', { method: 'POST', body });
      setEditing(null);
      load();
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="card">
      <div className="card-head">
        Team members
        {isAdmin && <button className="btn primary sm" onClick={() => setEditing({ role: 'salesperson', active: 1 })}><Plus size={14} /> Add user</button>}
      </div>
      <table className="data">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th>{isAdmin && <th />}</tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td><b>{u.name}</b></td>
              <td className="muted">{u.email}</td>
              <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
              <td>{u.active ? 'Active' : 'Disabled'}</td>
              {isAdmin && <td style={{ textAlign: 'right' }}><button className="btn sm" onClick={() => setEditing({ ...u, password: '' })}>Edit</button></td>}
            </tr>
          ))}
        </tbody>
      </table>

      {editing && (
        <Modal title={editing.id ? 'Edit user' : 'Add user'} onClose={() => setEditing(null)} footer={
          <>
            <button className="btn" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn primary" onClick={save}>Save</button>
          </>
        }>
          <Field label="Name"><input value={editing.name || ''} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} /></Field>
          <Field label="Email"><input type="email" value={editing.email || ''} onChange={(e) => setEditing((p) => ({ ...p, email: e.target.value }))} /></Field>
          <div className="form-grid">
            <Field label="Role">
              <select value={editing.role} onChange={(e) => setEditing((p) => ({ ...p, role: e.target.value }))}>
                {['admin', 'salesperson', 'dispatcher', 'crew'].map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label={editing.id ? 'New password (optional)' : 'Password'}>
              <input type="password" value={editing.password || ''} onChange={(e) => setEditing((p) => ({ ...p, password: e.target.value }))} />
            </Field>
          </div>
          {editing.id && (
            <label className="row" style={{ cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={!!editing.active} onChange={(e) => setEditing((p) => ({ ...p, active: e.target.checked ? 1 : 0 }))} />
              Active
            </label>
          )}
          {error && <div className="error-text">{error}</div>}
        </Modal>
      )}
    </div>
  );
}

function Templates({ isAdmin }) {
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = () => api('/settings/email-templates').then(setTemplates).catch(console.error);
  useEffect(() => { load(); }, []);

  const save = async () => {
    setError('');
    try {
      const body = { name: editing.name, subject: editing.subject, body: editing.body };
      if (editing.id) await api(`/settings/email-templates/${editing.id}`, { method: 'PUT', body });
      else await api('/settings/email-templates', { method: 'POST', body });
      setEditing(null);
      load();
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="card">
      <div className="card-head">
        Email templates
        {isAdmin && <button className="btn primary sm" onClick={() => setEditing({ name: '', subject: '', body: '' })}><Plus size={14} /> Add template</button>}
      </div>
      <div className="card-body">
        <p className="muted" style={{ marginTop: 0 }}>
          Use placeholders like {'{{first_name}}'}, {'{{move_date}}'}, {'{{estimated_total}}'}, {'{{job_number}}'}, {'{{company_name}}'} — fill them in when sending.
        </p>
        {templates.map((t) => (
          <div key={t.id} className="card" style={{ marginBottom: 10 }}>
            <div className="card-head">
              {t.name}
              {isAdmin && <button className="btn sm" onClick={() => setEditing(t)}>Edit</button>}
            </div>
            <div className="card-body">
              <div><b>Subject:</b> {t.subject}</div>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: 'var(--muted)', marginBottom: 0 }}>{t.body}</pre>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit template' : 'New template'} onClose={() => setEditing(null)} wide footer={
          <>
            <button className="btn" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn primary" onClick={save}>Save</button>
          </>
        }>
          <Field label="Template name"><input value={editing.name} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} /></Field>
          <Field label="Subject"><input value={editing.subject} onChange={(e) => setEditing((p) => ({ ...p, subject: e.target.value }))} /></Field>
          <Field label="Body"><textarea rows={8} value={editing.body} onChange={(e) => setEditing((p) => ({ ...p, body: e.target.value }))} /></Field>
          {error && <div className="error-text">{error}</div>}
        </Modal>
      )}
    </div>
  );
}
