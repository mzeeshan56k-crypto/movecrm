import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, money, fmtDate } from '../lib/api.js';
import { Empty } from '../components/ui.jsx';

const INV_COLORS = { draft: '#9ca3af', sent: '#0ea5e9', partial: '#f59e0b', paid: '#10b981', void: '#6b7280' };

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [status, setStatus] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    api(`/billing/invoices${status ? `?status=${status}` : ''}`).then(setInvoices).catch(console.error);
  }, [status]);

  const totals = invoices.reduce(
    (acc, i) => ({ total: acc.total + i.total, paid: acc.paid + i.paid, balance: acc.balance + i.balance }),
    { total: 0, paid: 0, balance: 0 }
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Billing</h1>
          <div className="sub">{invoices.length} invoices · {money(totals.balance)} outstanding</div>
        </div>
        <select style={{ width: 160 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['draft', 'sent', 'partial', 'paid', 'void'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="kpi-grid">
        <div className="kpi"><div className="label">Invoiced</div><div className="value">{money(totals.total)}</div></div>
        <div className="kpi"><div className="label">Collected</div><div className="value">{money(totals.paid)}</div></div>
        <div className="kpi"><div className="label">Outstanding</div><div className="value">{money(totals.balance)}</div></div>
      </div>

      <div className="card">
        {invoices.length === 0 ? <Empty>No invoices.</Empty> : (
          <table className="data">
            <thead><tr><th>Invoice #</th><th>Job</th><th>Customer</th><th>Status</th><th>Total</th><th>Paid</th><th>Balance</th><th>Due</th></tr></thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id} className="clickable" onClick={() => nav(`/jobs/${i.job_id}`)}>
                  <td><b>{i.invoice_number}</b></td>
                  <td>{i.job_number}</td>
                  <td>{i.first_name} {i.last_name}</td>
                  <td><span className="badge" style={{ background: INV_COLORS[i.status] }}>{i.status}</span></td>
                  <td>{money(i.total)}</td>
                  <td>{money(i.paid)}</td>
                  <td><b>{money(i.balance)}</b></td>
                  <td className="muted">{fmtDate(i.due_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
