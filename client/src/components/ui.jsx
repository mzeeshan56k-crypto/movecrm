import { X } from 'lucide-react';
import { STATUS_META } from '../lib/api.js';

export function Modal({ title, children, onClose, footer, wide }) {
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal${wide ? ' wide' : ''}`}>
        <div className="modal-head">
          {title}
          <button className="btn icon" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, color: '#64748b' };
  return <span className="badge" style={{ background: meta.color }}>{meta.label}</span>;
}

export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}
