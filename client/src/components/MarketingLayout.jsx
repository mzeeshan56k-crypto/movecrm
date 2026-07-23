import { Link } from 'react-router-dom';
import { Truck } from 'lucide-react';

const CALENDLY = 'https://calendly.com/mzseoconsultant/30min';

// Shared chrome (nav + footer) for marketing and blog pages, matching the
// homepage look. Keeps branding and links consistent across the site.
export default function MarketingLayout({ children }) {
  return (
    <div className="landing">
      <header className="lp-nav">
        <div className="lp-container lp-nav-inner">
          <Link to="/" className="lp-brand"><Truck size={24} /> Movers CRM</Link>
          <nav className="lp-nav-links">
            <Link to="/best-crm-for-moving-companies">Best CRM</Link>
            <Link to="/smartmoving-alternative">SmartMoving Alternative</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/login">Sign in</Link>
            <a href={CALENDLY} target="_blank" rel="noreferrer" className="btn primary lp-nav-cta">Book a demo</a>
          </nav>
        </div>
      </header>

      {children}

      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div className="lp-brand"><Truck size={20} /> Movers CRM</div>
          <div className="lp-footer-links">
            <Link to="/">Home</Link>
            <Link to="/best-crm-for-moving-companies">Best CRM</Link>
            <Link to="/smartmoving-alternative">SmartMoving Alternative</Link>
            <Link to="/blog">Blog</Link>
            <a href={CALENDLY} target="_blank" rel="noreferrer">Book a demo</a>
            <Link to="/login">Sign in</Link>
          </div>
          <div className="lp-footer-copy">© {new Date().getFullYear()} Movers CRM. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

export { CALENDLY };
