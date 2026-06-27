import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { api, money, fmtDate, fmtDateTime, STATUS_META, JOB_TYPES } from '../lib/api.js';
import { StatusBadge, Field, Modal, Empty } from '../components/ui.jsx';

const TABS = ['Overview', 'Estimate', 'Inventory', 'Dispatch', 'Billing', 'Activity'];

function JobDetailSkeleton() {
  return (
    <>
      <div className="page-head"><div style={{ flex: 1 }}>
        <div className="skeleton" style={{ height: 14, width: 120, marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 26, width: 320, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 14, width: 240 }} />
      </div></div>
      <div className="skeleton" style={{ height: 40, marginBottom: 18 }} />
      <div className="grid-2"><div className="skeleton" style={{ height: 320 }} /><div className="skeleton" style={{ height: 220 }} /></div>
    </>
  );
}

export default function JobDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [job, setJob] = useState(null);
  const [tab, setTab] = useState('Overview');
  const [error, setError] = useState('');
  const [lostOpen, setLostOpen] = useState(false);
  const [lostReason, setLostReason] = useState('');

  const load = () => api(`/jobs/${id}`).then(setJob).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [id]);

  if (error) return <div className="empty">{error}</div>;
  if (!job) return <JobDetailSkeleton />;

  const applyStatus = async (status, lost_reason) => {
    const updated = await api(`/jobs/${id}`, { method: 'PUT', body: { status, ...(lost_reason !== undefined ? { lost_reason } : {}) } });
    setJob(updated);
  };
  const onStatusChange = (status) => {
    if (status === 'lost') { setLostReason(''); setLostOpen(true); return; }
    applyStatus(status);
  };

  const balance = job.invoices.filter((i) => i.status !== 'void').reduce((s, i) => s + i.total, 0)
    - job.payments.reduce((s, p) => s + p.amount, 0);
  const TAB_COUNTS = {
    Estimate: job.estimate_items.length || null,
    Inventory: job.inventory_items.length || null,
    Dispatch: (job.crew.length + job.trucks.length) || null,
    Billing: job.invoices.length || null,
    Activity: job.activities.length || null,
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="row" style={{ marginBottom: 6 }}>
            <button className="btn sm" onClick={() => nav(-1)}><ArrowLeft size={14} /> Back</button>
            <StatusBadge status={job.status} />
          </div>
          <h1>{job.job_number} — {job.first_name} {job.last_name}</h1>
          <div className="sub">
            {JOB_TYPES[job.type]} move · {job.move_date ? fmtDate(job.move_date) : 'No date'} · Estimate <b>{money(job.estimated_total)}</b>
            {balance > 0.005 && <> · Balance due <b style={{ color: 'var(--danger)' }}>{money(balance)}</b></>}
          </div>
        </div>
        <div className="row">
          <label className="muted" style={{ fontSize: 12, fontWeight: 600 }}>Status</label>
          <select value={job.status} onChange={(e) => onStatusChange(e.target.value)} style={{ width: 160 }}>
            {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t}{TAB_COUNTS[t] ? <span className="tab-badge">{TAB_COUNTS[t]}</span> : null}
          </button>
        ))}
      </div>

      {tab === 'Overview' && <Overview job={job} onSaved={setJob} />}
      {tab === 'Estimate' && <Estimate job={job} onSaved={setJob} />}
      {tab === 'Inventory' && <Inventory job={job} onSaved={setJob} />}
      {tab === 'Dispatch' && <Dispatch job={job} onSaved={setJob} />}
      {tab === 'Billing' && <Billing job={job} onChanged={load} />}
      {tab === 'Activity' && <Activity job={job} onChanged={load} />}

      {lostOpen && (
        <Modal title="Mark job as lost" onClose={() => setLostOpen(false)} footer={
          <>
            <button className="btn" onClick={() => setLostOpen(false)}>Cancel</button>
            <button className="btn danger" onClick={() => { applyStatus('lost', lostReason); setLostOpen(false); }}>Mark as lost</button>
          </>
        }>
          <Field label="Why was this job lost? (helps your reporting)">
            <select value={lostReason} onChange={(e) => setLostReason(e.target.value)}>
              <option value="">Select a reason…</option>
              {['Price too high', 'Went with competitor', 'Move cancelled', 'Bad timing', 'No response', 'Other'].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
        </Modal>
      )}
    </>
  );
}

/* ---------- Overview ---------- */
function Overview({ job, onSaved }) {
  const [f, setF] = useState(job);
  const [moveSizes, setMoveSizes] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [users, setUsers] = useState([]);
  const [saved, setSaved] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    setF(job);
    api('/settings/move-sizes').then(setMoveSizes).catch(() => {});
    api('/settings/lead-sources').then(setLeadSources).catch(() => {});
    api('/settings/users').then(setUsers).catch(() => {});
  }, [job.id]);

  const save = async () => {
    const updated = await api(`/jobs/${job.id}`, {
      method: 'PUT',
      body: {
        type: f.type, move_date: f.move_date || null, arrival_window: f.arrival_window,
        move_size_id: f.move_size_id || null, lead_source_id: f.lead_source_id || null,
        salesperson_id: f.salesperson_id || null, distance_miles: f.distance_miles || null,
        origin_address: f.origin_address, origin_city: f.origin_city, origin_state: f.origin_state, origin_zip: f.origin_zip, origin_floor: f.origin_floor,
        dest_address: f.dest_address, dest_city: f.dest_city, dest_state: f.dest_state, dest_zip: f.dest_zip, dest_floor: f.dest_floor,
        notes: f.notes,
      },
    });
    onSaved(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="grid-2">
      <div className="card">
        <div className="card-head">Move details</div>
        <div className="card-body">
          <div className="form-grid">
            <Field label="Move type">
              <select value={f.type} onChange={set('type')}>
                {Object.entries(JOB_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Move size">
              <select value={f.move_size_id || ''} onChange={set('move_size_id')}>
                <option value="">Select…</option>
                {moveSizes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
            <Field label="Move date"><input type="date" value={f.move_date || ''} onChange={set('move_date')} /></Field>
            <Field label="Arrival window"><input value={f.arrival_window || ''} onChange={set('arrival_window')} placeholder="8:00 - 10:00" /></Field>
            <Field label="Distance (miles)"><input type="number" value={f.distance_miles || ''} onChange={set('distance_miles')} /></Field>
            <Field label="Lead source">
              <select value={f.lead_source_id || ''} onChange={set('lead_source_id')}>
                <option value="">Select…</option>
                {leadSources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Salesperson">
              <select value={f.salesperson_id || ''} onChange={set('salesperson_id')}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </Field>
          </div>

          <div className="section-title">Origin</div>
          <div className="form-grid">
            <Field label="Address"><input value={f.origin_address || ''} onChange={set('origin_address')} /></Field>
            <Field label="City"><input value={f.origin_city || ''} onChange={set('origin_city')} /></Field>
            <Field label="State"><input value={f.origin_state || ''} onChange={set('origin_state')} /></Field>
            <Field label="ZIP"><input value={f.origin_zip || ''} onChange={set('origin_zip')} /></Field>
          </div>
          <div className="section-title">Destination</div>
          <div className="form-grid">
            <Field label="Address"><input value={f.dest_address || ''} onChange={set('dest_address')} /></Field>
            <Field label="City"><input value={f.dest_city || ''} onChange={set('dest_city')} /></Field>
            <Field label="State"><input value={f.dest_state || ''} onChange={set('dest_state')} /></Field>
            <Field label="ZIP"><input value={f.dest_zip || ''} onChange={set('dest_zip')} /></Field>
          </div>
          <Field label="Internal notes"><textarea rows={3} value={f.notes || ''} onChange={set('notes')} /></Field>
          <button className="btn primary" onClick={save}><Save size={15} /> {saved ? 'Saved!' : 'Save changes'}</button>
        </div>
      </div>

      <div>
        <div className="card">
          <div className="card-head">Customer</div>
          <div className="card-body">
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              <Link to={`/customers/${job.customer_id}`}>{job.first_name} {job.last_name}</Link>
            </div>
            <div className="muted mt">{job.customer_email || 'No email'}</div>
            <div className="muted">{job.customer_phone || 'No phone'}</div>
          </div>
        </div>
        <div className="card mt">
          <div className="card-head">Summary</div>
          <div className="card-body">
            <div className="row spread" style={{ padding: '5px 0' }}><span className="muted">Created</span><span>{fmtDate(job.created_at)}</span></div>
            <div className="row spread" style={{ padding: '5px 0' }}><span className="muted">Booked</span><span>{job.booked_at ? fmtDate(job.booked_at) : '—'}</span></div>
            <div className="row spread" style={{ padding: '5px 0' }}><span className="muted">Completed</span><span>{job.completed_at ? fmtDate(job.completed_at) : '—'}</span></div>
            <div className="row spread" style={{ padding: '5px 0' }}><span className="muted">Estimate total</span><b>{money(job.estimated_total)}</b></div>
            <div className="row spread" style={{ padding: '5px 0' }}><span className="muted">Crew assigned</span><span>{job.crew.length}</span></div>
            <div className="row spread" style={{ padding: '5px 0' }}><span className="muted">Trucks</span><span>{job.trucks.length}</span></div>
            {job.status === 'lost' && (
              <div className="row spread" style={{ padding: '5px 0' }}><span className="muted">Lost reason</span><span>{job.lost_reason || '—'}</span></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Estimate ---------- */
function Estimate({ job, onSaved }) {
  const [items, setItems] = useState(job.estimate_items.length ? job.estimate_items : []);
  const [services, setServices] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => { api('/settings/services').then(setServices).catch(() => {}); }, []);
  useEffect(() => { setItems(job.estimate_items); }, [job.id]);

  const update = (i, k, v) => setItems((p) => p.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  const addBlank = () => setItems((p) => [...p, { name: '', rate_type: 'flat', quantity: 1, rate: 0 }]);
  const addService = (svc) => setItems((p) => [...p, { name: svc.name, rate_type: svc.rate_type, quantity: 1, rate: svc.rate }]);
  const remove = (i) => setItems((p) => p.filter((_, idx) => idx !== i));
  const total = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.rate) || 0), 0);

  const save = async () => {
    const updated = await api(`/jobs/${job.id}/estimate`, { method: 'PUT', body: { items } });
    onSaved(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="grid-3070">
      <div className="card">
        <div className="card-head">
          Estimate line items
          <button className="btn sm" onClick={addBlank}><Plus size={14} /> Add line</button>
        </div>
        {items.length === 0 ? <Empty>No line items yet. Add services from the catalog →</Empty> : (
          <table className="data">
            <thead><tr><th style={{ width: '40%' }}>Item</th><th>Qty / Hrs</th><th>Rate</th><th>Amount</th><th /></tr></thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td><input value={it.name} onChange={(e) => update(i, 'name', e.target.value)} /></td>
                  <td><input type="number" step="0.5" value={it.quantity} onChange={(e) => update(i, 'quantity', e.target.value)} /></td>
                  <td><input type="number" step="0.01" value={it.rate} onChange={(e) => update(i, 'rate', e.target.value)} /></td>
                  <td><b>{money((Number(it.quantity) || 0) * (Number(it.rate) || 0))}</b></td>
                  <td><button className="btn icon sm danger" onClick={() => remove(i)}><Trash2 size={14} /></button></td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700 }}>Total</td>
                <td colSpan={2} style={{ fontWeight: 800, fontSize: 15 }}>{money(total)}</td>
              </tr>
            </tbody>
          </table>
        )}
        <div className="card-body" style={{ borderTop: '1px solid var(--border)' }}>
          <button className="btn primary" onClick={save}><Save size={15} /> {saved ? 'Saved!' : 'Save estimate'}</button>
        </div>
      </div>

      <div className="card">
        <div className="card-head">Service catalog</div>
        <div className="card-body">
          {services.filter((s) => s.active).map((s) => (
            <div key={s.id} className="row spread" style={{ padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div className="muted" style={{ fontSize: 12 }}>{money(s.rate)} · {s.rate_type}</div>
              </div>
              <button className="btn sm" onClick={() => addService(s)}><Plus size={13} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Inventory ---------- */
function Inventory({ job, onSaved }) {
  const [items, setItems] = useState(job.inventory_items);
  const [saved, setSaved] = useState(false);
  useEffect(() => { setItems(job.inventory_items); }, [job.id]);

  const update = (i, k, v) => setItems((p) => p.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  const add = () => setItems((p) => [...p, { room: 'General', name: '', quantity: 1, cubic_feet: 0 }]);
  const remove = (i) => setItems((p) => p.filter((_, idx) => idx !== i));
  const totalCuft = items.reduce((s, it) => s + (Number(it.cubic_feet) || 0) * (Number(it.quantity) || 0), 0);

  const save = async () => {
    const updated = await api(`/jobs/${job.id}/inventory`, { method: 'PUT', body: { items } });
    onSaved(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="card">
      <div className="card-head">
        Inventory — {totalCuft.toFixed(0)} cu ft total
        <button className="btn sm" onClick={add}><Plus size={14} /> Add item</button>
      </div>
      {items.length === 0 ? <Empty>No inventory recorded for this move yet.</Empty> : (
        <table className="data">
          <thead><tr><th>Room</th><th style={{ width: '40%' }}>Item</th><th>Qty</th><th>Cu ft (each)</th><th /></tr></thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td><input value={it.room} onChange={(e) => update(i, 'room', e.target.value)} /></td>
                <td><input value={it.name} onChange={(e) => update(i, 'name', e.target.value)} /></td>
                <td><input type="number" value={it.quantity} onChange={(e) => update(i, 'quantity', e.target.value)} /></td>
                <td><input type="number" step="0.5" value={it.cubic_feet} onChange={(e) => update(i, 'cubic_feet', e.target.value)} /></td>
                <td><button className="btn icon sm danger" onClick={() => remove(i)}><Trash2 size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="card-body" style={{ borderTop: '1px solid var(--border)' }}>
        <button className="btn primary" onClick={save}><Save size={15} /> {saved ? 'Saved!' : 'Save inventory'}</button>
      </div>
    </div>
  );
}

/* ---------- Dispatch ---------- */
function Dispatch({ job, onSaved }) {
  const [crew, setCrew] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [crewIds, setCrewIds] = useState(job.crew.map((c) => c.id));
  const [truckIds, setTruckIds] = useState(job.trucks.map((t) => t.id));
  const [window_, setWindow] = useState(job.arrival_window || '');
  const [notes, setNotes] = useState(job.crew_notes || '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api('/resources/crew').then(setCrew).catch(() => {});
    api('/resources/trucks').then(setTrucks).catch(() => {});
  }, []);

  const toggle = (list, setList, id) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const save = async () => {
    const updated = await api(`/jobs/${job.id}/dispatch`, {
      method: 'PUT',
      body: { crew_ids: crewIds, truck_ids: truckIds, arrival_window: window_, crew_notes: notes },
    });
    onSaved(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="grid-2">
      <div className="card">
        <div className="card-head">Assign crew</div>
        <div className="card-body">
          {crew.filter((c) => c.active).map((c) => (
            <label key={c.id} className="row" style={{ padding: '7px 0', cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={crewIds.includes(c.id)} onChange={() => toggle(crewIds, setCrewIds, c.id)} />
              <div>
                <b>{c.name}</b> <span className="muted">· {c.role}</span>
              </div>
            </label>
          ))}
          <div className="section-title">Assign trucks</div>
          {trucks.filter((t) => t.status === 'available').map((t) => (
            <label key={t.id} className="row" style={{ padding: '7px 0', cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={truckIds.includes(t.id)} onChange={() => toggle(truckIds, setTruckIds, t.id)} />
              <div><b>{t.name}</b> <span className="muted">· {t.capacity_cuft} cu ft</span></div>
            </label>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-head">Schedule & crew notes</div>
        <div className="card-body">
          <Field label="Move date"><input value={job.move_date || 'Not set'} disabled /></Field>
          <Field label="Arrival window"><input value={window_} onChange={(e) => setWindow(e.target.value)} placeholder="8:00 - 10:00" /></Field>
          <Field label="Notes for crew"><textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gate code, parking instructions, fragile items…" /></Field>
          <button className="btn primary" onClick={save}><Save size={15} /> {saved ? 'Saved!' : 'Save dispatch'}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Billing ---------- */
function Billing({ job, onChanged }) {
  const [showInvoice, setShowInvoice] = useState(false);
  const [showPayment, setShowPayment] = useState(null); // invoice object
  const [taxRate, setTaxRate] = useState(8.25);
  const [discount, setDiscount] = useState(0);
  const [pay, setPay] = useState({ amount: '', method: 'card', reference: '' });
  const [error, setError] = useState('');
  const [company, setCompany] = useState({});

  useEffect(() => { api('/settings/company').then(setCompany).catch(() => {}); }, []);

  const totalPaid = job.payments.reduce((s, p) => s + p.amount, 0);
  const totalInvoiced = job.invoices.filter((i) => i.status !== 'void').reduce((s, i) => s + i.total, 0);
  const paidFor = (inv) => job.payments.filter((p) => p.invoice_id === inv.id).reduce((s, p) => s + p.amount, 0);
  const balanceFor = (inv) => Math.round((inv.total - paidFor(inv)) * 100) / 100;

  const createInvoice = async () => {
    setError('');
    try {
      await api('/billing/invoices', { method: 'POST', body: { job_id: job.id, tax_rate: Number(taxRate), discount: Number(discount) } });
      setShowInvoice(false);
      onChanged();
    } catch (e) { setError(e.message); }
  };

  const openPayment = (inv) => {
    const bal = balanceFor(inv);
    setShowPayment(inv);
    setPay({ amount: bal > 0 ? String(bal) : '', method: 'card', reference: '' });
  };

  const recordPayment = async () => {
    setError('');
    try {
      await api(`/billing/invoices/${showPayment.id}/payments`, {
        method: 'POST',
        body: { amount: Number(pay.amount), method: pay.method, reference: pay.reference },
      });
      setShowPayment(null);
      setPay({ amount: '', method: 'card', reference: '' });
      onChanged();
    } catch (e) { setError(e.message); }
  };

  const voidInvoice = async (inv) => {
    if (!window.confirm(`Void invoice ${inv.invoice_number}? This can't be undone.`)) return;
    await api(`/billing/invoices/${inv.id}`, { method: 'PUT', body: { status: 'void' } });
    onChanged();
  };

  const printInvoice = (inv) => {
    const items = job.estimate_items || [];
    const pays = job.payments.filter((p) => p.invoice_id === inv.id);
    const taxAmt = (inv.subtotal - inv.discount) * inv.tax_rate / 100;
    const esc = (s) => String(s == null ? '' : s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
    const win = window.open('', '_blank', 'width=820,height=920');
    if (!win) { alert('Please allow pop-ups to print invoices.'); return; }
    win.document.write(`<!doctype html><html><head><title>Invoice ${esc(inv.invoice_number)}</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;padding:42px;max-width:720px;margin:0 auto}
      h1{color:#2563eb;margin:0;font-size:24px}table{width:100%;border-collapse:collapse}
      th,td{padding:9px 6px;border-bottom:1px solid #e2e8f0;font-size:14px}th{text-align:left;color:#64748b;font-size:11px;text-transform:uppercase}
      .muted{color:#64748b}.right{text-align:right}.tot td{border:none;padding:4px 6px}</style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div><h1>${esc(company.company_name || 'Your Moving Company')}</h1>
          <div class="muted" style="font-size:13px;margin-top:4px">${esc(company.company_address || '')}<br/>${esc(company.company_phone || '')} ${company.company_email ? '· ' + esc(company.company_email) : ''}</div></div>
        <div class="right"><div style="font-size:22px;font-weight:800">INVOICE</div>
          <div class="muted" style="font-size:13px">${esc(inv.invoice_number)}<br/>Issued ${fmtDate(inv.created_at)}<br/>${inv.due_date ? 'Due ' + fmtDate(inv.due_date) : ''}</div></div>
      </div>
      <div style="margin-top:26px;font-size:14px"><b>Bill to</b><br/>${esc(job.first_name)} ${esc(job.last_name)}<br/>
        <span class="muted">${esc(job.customer_email || '')} ${esc(job.customer_phone || '')}</span></div>
      <table style="margin-top:18px"><thead><tr><th>Item</th><th class="right">Qty</th><th class="right">Rate</th><th class="right">Amount</th></tr></thead>
        <tbody>${items.map((it) => `<tr><td>${esc(it.name)}</td><td class="right">${it.quantity}</td><td class="right">${money(it.rate)}</td><td class="right">${money(it.quantity * it.rate)}</td></tr>`).join('') || '<tr><td colspan=4 class="muted">No line items</td></tr>'}</tbody></table>
      <table class="tot" style="margin-top:12px;margin-left:auto;width:300px">
        <tr><td class="muted">Subtotal</td><td class="right">${money(inv.subtotal)}</td></tr>
        ${inv.discount ? `<tr><td class="muted">Discount</td><td class="right">-${money(inv.discount)}</td></tr>` : ''}
        <tr><td class="muted">Tax (${inv.tax_rate}%)</td><td class="right">${money(taxAmt)}</td></tr>
        <tr><td style="font-size:16px"><b>Total</b></td><td class="right" style="font-size:16px"><b>${money(inv.total)}</b></td></tr>
        <tr><td class="muted">Paid</td><td class="right">${money(paidFor(inv))}</td></tr>
        <tr><td><b>Balance due</b></td><td class="right"><b>${money(balanceFor(inv))}</b></td></tr>
      </table>
      ${pays.length ? `<div style="margin-top:24px"><b>Payments</b><table><tbody>${pays.map((p) => `<tr><td>${fmtDate(p.paid_at)}</td><td style="text-transform:capitalize">${esc(p.method)}</td><td class="right">${money(p.amount)}</td></tr>`).join('')}</tbody></table></div>` : ''}
      <p class="muted" style="margin-top:34px">Thank you for choosing ${esc(company.company_name || 'us')}!</p>
      </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 350);
  };

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi"><div className="label">Estimate</div><div className="value">{money(job.estimated_total)}</div></div>
        <div className="kpi"><div className="label">Invoiced</div><div className="value">{money(totalInvoiced)}</div></div>
        <div className="kpi"><div className="label">Paid</div><div className="value">{money(totalPaid)}</div></div>
        <div className="kpi"><div className="label">Balance</div><div className="value">{money(totalInvoiced - totalPaid)}</div></div>
      </div>

      <div className="card">
        <div className="card-head">
          Invoices
          <button className="btn primary sm" onClick={() => setShowInvoice(true)}><Plus size={14} /> Create invoice from estimate</button>
        </div>
        {job.invoices.length === 0 ? <Empty>No invoices yet — create one from the estimate above.</Empty> : (
          <table className="data">
            <thead><tr><th>Invoice #</th><th>Status</th><th>Total</th><th>Paid</th><th>Balance</th><th>Due</th><th /></tr></thead>
            <tbody>
              {job.invoices.map((inv) => (
                <tr key={inv.id}>
                  <td><b>{inv.invoice_number}</b></td>
                  <td><span className="badge" style={{ background: inv.status === 'paid' ? '#10b981' : inv.status === 'partial' ? '#f59e0b' : inv.status === 'void' ? '#9ca3af' : '#0ea5e9' }}>{inv.status}</span></td>
                  <td><b>{money(inv.total)}</b></td>
                  <td>{money(paidFor(inv))}</td>
                  <td><b>{money(balanceFor(inv))}</b></td>
                  <td>{fmtDate(inv.due_date)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {inv.status !== 'paid' && inv.status !== 'void' && (
                      <button className="btn sm primary" onClick={() => openPayment(inv)}>Record payment</button>
                    )}{' '}
                    <button className="btn sm" onClick={() => printInvoice(inv)}>Print</button>{' '}
                    {inv.status !== 'void' && inv.status !== 'paid' && (
                      <button className="btn icon sm danger" title="Void" onClick={() => voidInvoice(inv)}><Trash2 size={13} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card mt">
        <div className="card-head">Payments</div>
        {job.payments.length === 0 ? <Empty>No payments recorded.</Empty> : (
          <table className="data">
            <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th></tr></thead>
            <tbody>
              {job.payments.map((p) => (
                <tr key={p.id}>
                  <td>{fmtDateTime(p.paid_at)}</td>
                  <td><b>{money(p.amount)}</b></td>
                  <td style={{ textTransform: 'capitalize' }}>{p.method}</td>
                  <td className="muted">{p.reference || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showInvoice && (
        <Modal title="Create invoice" onClose={() => setShowInvoice(false)} footer={
          <>
            <button className="btn" onClick={() => setShowInvoice(false)}>Cancel</button>
            <button className="btn primary" onClick={createInvoice}>Create</button>
          </>
        }>
          <p className="muted">Creates an invoice from the current estimate total ({money(job.estimated_total)}).</p>
          <div className="form-grid">
            <Field label="Tax rate (%)"><input type="number" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} /></Field>
            <Field label="Discount ($)"><input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} /></Field>
          </div>
          <p><b>Total: {money((job.estimated_total - discount) * (1 + taxRate / 100))}</b></p>
          {error && <div className="error-text">{error}</div>}
        </Modal>
      )}

      {showPayment && (
        <Modal title={`Record payment — ${showPayment.invoice_number}`} onClose={() => setShowPayment(null)} footer={
          <>
            <button className="btn" onClick={() => setShowPayment(null)}>Cancel</button>
            <button className="btn primary" onClick={recordPayment} disabled={!pay.amount}>Record</button>
          </>
        }>
          <div className="form-grid">
            <Field label="Amount ($)"><input type="number" step="0.01" value={pay.amount} onChange={(e) => setPay((p) => ({ ...p, amount: e.target.value }))} autoFocus /></Field>
            <Field label="Method">
              <select value={pay.method} onChange={(e) => setPay((p) => ({ ...p, method: e.target.value }))}>
                {['card', 'cash', 'check', 'ach', 'other'].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Reference / check #"><input value={pay.reference} onChange={(e) => setPay((p) => ({ ...p, reference: e.target.value }))} /></Field>
          {error && <div className="error-text">{error}</div>}
        </Modal>
      )}
    </>
  );
}

/* ---------- Activity ---------- */
function Activity({ job, onChanged }) {
  const [type, setType] = useState('note');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');

  const addActivity = async () => {
    if (!subject && !body) return;
    await api(`/jobs/${job.id}/activities`, { method: 'POST', body: { type, subject, body } });
    setSubject(''); setBody('');
    onChanged();
  };

  const addTask = async () => {
    if (!taskTitle) return;
    await api('/settings/tasks', { method: 'POST', body: { title: taskTitle, job_id: job.id, due_date: taskDue || null } });
    setTaskTitle(''); setTaskDue('');
    onChanged();
  };

  const toggleTask = async (t) => {
    await api(`/settings/tasks/${t.id}`, { method: 'PUT', body: { completed: t.completed ? 0 : 1 } });
    onChanged();
  };

  return (
    <div className="grid-3070">
      <div className="card">
        <div className="card-head">Activity timeline</div>
        <div className="card-body">
          <div className="row" style={{ marginBottom: 12 }}>
            <select style={{ width: 110 }} value={type} onChange={(e) => setType(e.target.value)}>
              {['note', 'call', 'email', 'sms'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input style={{ flex: 1 }} placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <textarea rows={2} placeholder="Details…" value={body} onChange={(e) => setBody(e.target.value)} />
          <button className="btn primary sm" style={{ marginTop: 8 }} onClick={addActivity}>Log activity</button>

          <div style={{ marginTop: 18 }}>
            {job.activities.map((a) => (
              <div className="activity-item" key={a.id}>
                <div className="activity-icon" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{a.type.slice(0, 2)}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{a.subject || a.type}</div>
                  {a.body && <div className="muted" style={{ whiteSpace: 'pre-wrap' }}>{a.body}</div>}
                  <div className="muted" style={{ fontSize: 12 }}>{a.user_name || 'System'} · {fmtDateTime(a.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">Tasks</div>
        <div className="card-body">
          <input placeholder="New task…" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
          <div className="row" style={{ marginTop: 8 }}>
            <input type="date" style={{ flex: 1 }} value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
            <button className="btn sm primary" onClick={addTask}><Plus size={13} /> Add</button>
          </div>
          <div style={{ marginTop: 14 }}>
            {job.tasks.map((t) => (
              <label key={t.id} className="row" style={{ padding: '6px 0', cursor: 'pointer' }}>
                <input type="checkbox" style={{ width: 'auto' }} checked={!!t.completed} onChange={() => toggleTask(t)} />
                <div style={{ textDecoration: t.completed ? 'line-through' : 'none' }}>
                  {t.title}
                  <div className="muted" style={{ fontSize: 12 }}>{t.due_date ? `Due ${fmtDate(t.due_date)}` : ''}</div>
                </div>
              </label>
            ))}
            {job.tasks.length === 0 && <span className="muted">No tasks for this job.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
