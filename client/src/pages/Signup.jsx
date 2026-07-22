import { Link } from 'react-router-dom';
import { Truck, CalendarClock, ArrowRight } from 'lucide-react';

const CALENDLY = 'https://calendly.com/mzseoconsultant/30min';

// Public self-serve signup is disabled — accounts are set up after a demo.
// Anyone landing here is guided to book a meeting instead.
export default function Signup() {
  return (
    <div className="login-page">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <div className="logo" style={{ justifyContent: 'center' }}><Truck size={26} color="#2563eb" /> Movers CRM</div>
        <p className="muted" style={{ marginTop: 0 }}>
          Movers CRM is set up for you personally. There is no self-serve sign-up. Book a quick demo and we will
          get your workspace ready, tailored to your moving company.
        </p>
        <a href={CALENDLY} target="_blank" rel="noreferrer" className="btn primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
          <CalendarClock size={18} /> Book a free demo
        </a>
        <a href="/" className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}>
          Back to home <ArrowRight size={16} />
        </a>
        <p className="muted" style={{ fontSize: 13, marginTop: 16 }}>
          Already a customer? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
