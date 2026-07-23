import { useEffect, useState } from 'react';
import { X, CalendarClock, Sparkles } from 'lucide-react';

const CALENDLY = 'https://calendly.com/mzseoconsultant/30min';
const DISMISS_KEY = 'moverscrm_promo_dismissed_v1';
// Offer runs until 1 August. After that the popup stays hidden automatically.
const OFFER_ENDS = new Date('2026-08-01T23:59:59');

export default function PromoPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (Date.now() > OFFER_ENDS.getTime()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    setOpen(false);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
  };

  if (!open) return null;

  return (
    <div className="promo-overlay" role="dialog" aria-modal="true" aria-label="Limited time offer" onClick={close}>
      <div className="promo-card" onClick={(e) => e.stopPropagation()}>
        <button className="promo-close" onClick={close} aria-label="Close">
          <X size={18} />
        </button>
        <div className="promo-glow" />
        <div className="promo-body">
          <span className="promo-badge"><Sparkles size={13} /> Limited time offer</span>
          <h2>Get a Movers CRM lifetime plan</h2>
          <p>
            Lock in lifetime access to Movers CRM. This launch offer is open until
            <strong> 1 August</strong>. Book a quick call and we will set everything up for your moving
            company, then hand you the keys for life.
          </p>
          <ul className="promo-list">
            <li>One-time deal, no monthly fees</li>
            <li>Done-for-you onboarding and setup</li>
            <li>Every feature: pipeline, dispatch, billing, reviews and integrations</li>
          </ul>
          <a href={CALENDLY} target="_blank" rel="noreferrer" className="btn primary promo-cta" onClick={close}>
            <CalendarClock size={18} /> Book a meeting to claim it
          </a>
          <button className="promo-dismiss" onClick={close}>No thanks, maybe later</button>
        </div>
      </div>
    </div>
  );
}
