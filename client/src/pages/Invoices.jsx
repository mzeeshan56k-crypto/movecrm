import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, DollarSign, AlertCircle } from 'lucide-react';
import { api, money, fmtDate } from '../lib/api.js';
import { useLive } from '../lib/useLive.js';
import { Empty } from '../components/ui.jsx';

const INV_COLORS = { draft: '#9ca3af', sent: '#0ea5e9', partial: '#f59e0b', paid: '#10b981', void: '#6b7280' };
const todayStr = () => new Date().toISOString().slice(0, 10);
const isOverdue = (i) => i.due_date && i.due_date < todayStr() && i.balance > 0.005 && !['paid', 'void'].includes(i.status);

export default function Invoices() {
  const [invoices, setInvoices] = useState(null);
  const [filter, setFilter] = useState('');
  const reqId = useRef(0);
  const nav = useNavigate();

  const load = () => {
    const id = ++reqId.current;
    return api('/billing/invoices').then((d) => { if (id === reqId.current) setInvoices(d); }).catch(console.error);
  };
  useEffect(() => { load(); }, []);
  useLive(load, []);

  const all = invoices || [];
  // KPIs reflect ALL invoices (not the current filter) so the overview is accurate.
  const totals = all.reduce((a, i) => ({ total: a.total + i.total, paid: a.paid + i.paid, balance: a.balance + i.balance }), { total: 0, paid: 0, balance: 0 });
  const overdueCount = all.filter(isOverdue).length;

  const shown = !filter ? all
    : filter === 'outstanding' ? all.filter((i) => ['sent', 'partial'].includes(i.status))
    : filter === 'overdue' ? all.filter(isOverdue)
    : all.filter((i) => i.status === filter);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Invoicing</h1>
          <div className="sub">{invoices === null ? 'Loading…' : `${all.length} invoice${all.length === 1 ? '' : 's'} · ${money(totals.balance)} outstanding`}</div>
        </div>
        <select style={{ width: 170 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="outstanding">Outstanding</option>
          <option value="overdue">Overdue{overdueCount ? ` (${overdueCount})` : ''}</option>
          {['draft', 'sent', 'partial', 'paid', 'void'].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="kpi kpi-rich"><div className="kpi-icon" style={{ background: '#6366f11a', color: '#6366f1' }}><FileText size={18} /></div><div><div className="label">Invoiced</div><div className="value">{money(totals.total)}</div></div></div>
        <div className="kpi kpi-rich"><div className="kpi-icon" style={{ background: '#10b9811a', color: '#10b981' }}><DollarSign size={18} /></div><div><div className="label">Collected</div><div className="value">{money(totals.paid)}</div></div></div>
        <div className="kpi kpi-rich"><div className="kpi-icon" style={{ background: '#f59e0b1a', color: '#f59e0b' }}><AlertCircle size={18} /></div><div><div className="label">Outstanding</div><div className="value">{money(totals.balance)}</div></div></div>
        {overdueCount > 0 && <div className="kpi kpi-rich"><div className="kpi-icon" style={{ background: '#ef44441a', color: '#ef4444' }}><AlertCircle size={18} /></div><div><div className="label">Overdue</div><div className="value">{overdueCount}</div></div></div>}
      </div>

      <div className="card">
        {invoices === null ? (
          <table className="data">
            <thead><tr><th>Invoice #</th><th>Job</th><th>Customer</th><th>Status</th><th>Total</th><th>Paid</th><th>Balance</th><th>Due</th></tr></thead>
            <tbody>{Array.from({ length: 6 }).map((_, i) => <tr key={i}>{Array.from({ length: 8 }).map((__, k) => <td key={k}><div className="skeleton" style={{ height: 14 }} /></td>)}</tr>)}</tbody>
          </table>
        ) : shown.length === 0 ? (
          <Empty>{all.length === 0 ? 'No invoices yet. Create one from a job’s Billing tab.' : 'No invoices match this filter.'}</Empty>
        ) : (
          <table className="data">
            <thead><tr><th>Invoice #</th><th>Job</th><th>Customer</th><th>Status</th><th>Total</th><th>Paid</th><th>Balance</th><th>Due</th></tr></thead>
            <tbody>
              {shown.map((i) => (
                <tr key={i.id} className="clickable" onClick={() => nav(`/jobs/${i.job_id}`)}>
                  <td><b>{i.invoice_number}</b></td>
                  <td>{i.job_number}</td>
                  <td>{i.first_name} {i.last_name}</td>
                  <td>
                    <span className="badge" style={{ background: INV_COLORS[i.status] }}>{i.status}</span>
                    {isOverdue(i) && <span className="badge" style={{ background: '#ef4444', marginLeft: 5 }}>overdue</span>}
                  </td>
                  <td>{money(i.total)}</td>
                  <td>{money(i.paid)}</td>
                  <td><b>{money(i.balance)}</b></td>
                  <td className={isOverdue(i) ? 'error-text' : 'muted'} style={{ fontWeight: isOverdue(i) ? 700 : 400 }}>{fmtDate(i.due_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
