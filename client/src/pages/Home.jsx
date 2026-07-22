import { Link } from 'react-router-dom';
import {
  Truck, ArrowRight, CalendarClock, LayoutDashboard, KanbanSquare, Calculator,
  Route as RouteIcon, Receipt, Star, PhoneCall, BarChart3, ShieldCheck, Check, Zap,
} from 'lucide-react';

const CALENDLY = 'https://calendly.com/mzseoconsultant/30min';

const FEATURES = [
  { icon: KanbanSquare, title: 'Sales pipeline', desc: 'Drag-and-drop Kanban from first call to booked job — never lose a lead again.' },
  { icon: Calculator, title: 'Instant estimating', desc: 'Line-item quotes off a configurable tariff that total themselves in seconds.' },
  { icon: RouteIcon, title: 'Dispatch & crews', desc: 'A live day board with real-time crew and truck availability at a glance.' },
  { icon: Receipt, title: 'Billing that closes', desc: 'Invoices from estimates, card/cash/ACH payments, and balances tracked automatically.' },
  { icon: PhoneCall, title: 'Calls become leads', desc: 'Inbound calls are answered, recorded, and turned into leads without lifting a finger.' },
  { icon: Star, title: 'Reputation on autopilot', desc: 'Finished jobs auto-request reviews and route your happiest customers to Google.' },
  { icon: BarChart3, title: 'Reports that decide', desc: 'Lead-source ROI, salesperson performance, and cash collected — the numbers that matter.' },
  { icon: LayoutDashboard, title: 'One clean dashboard', desc: 'Bookings, moves today, cash collected, and conversion rate the moment you log in.' },
];

const STATS = [
  { value: '20+', label: 'Modules in one app' },
  { value: '5 min', label: 'To your first quote' },
  { value: '100%', label: 'Multi-tenant & secure' },
  { value: '14-day', label: 'Free trial, no card' },
];

const PLANS = [
  { name: 'Starter', price: '$100', unit: '/mo', blurb: '1 website', features: ['Full CRM & pipeline', 'Estimating & billing', 'Lead capture'] },
  { name: 'Growth', price: '$200', unit: '/mo', blurb: '5 websites', features: ['Everything in Starter', 'Dispatch & crews', 'Reviews & reputation'], featured: true },
  { name: 'Pro', price: '$400', unit: '/mo', blurb: '15 websites', features: ['Everything in Growth', 'Advanced analytics', 'Priority support'] },
];

export default function Home() {
  return (
    <div className="landing">
      {/* Nav */}
      <header className="lp-nav">
        <div className="lp-container lp-nav-inner">
          <Link to="/" className="lp-brand"><Truck size={24} /> Move CRM</Link>
          <nav className="lp-nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <Link to="/login">Sign in</Link>
            <a href={CALENDLY} target="_blank" rel="noreferrer" className="btn primary lp-nav-cta">Book a demo</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-glow lp-glow-a" />
        <div className="lp-glow lp-glow-b" />
        <div className="lp-container lp-hero-inner">
          <span className="lp-pill"><Zap size={13} /> The operating system for moving companies</span>
          <h1>Move faster.<br /><span className="lp-grad">Book more moves.</span></h1>
          <p className="lp-sub">
            Move CRM runs your whole moving company in one place — leads, estimates, dispatch,
            crews, billing, and reviews. Less busywork, more booked jobs.
          </p>
          <div className="lp-hero-cta">
            <Link to="/signup" className="btn primary lp-btn-lg">Start free <ArrowRight size={18} /></Link>
            <a href={CALENDLY} target="_blank" rel="noreferrer" className="btn lp-btn-lg lp-btn-ghost">
              <CalendarClock size={18} /> Book a demo
            </a>
          </div>
          <div className="lp-trust"><Check size={15} /> 14-day free trial · No credit card required</div>

          {/* Product mock */}
          <div className="lp-mock">
            <div className="lp-mock-bar"><span /><span /><span /></div>
            <div className="lp-mock-body">
              <div className="lp-mock-side">
                <div className="lp-mock-logo"><Truck size={16} /> Move CRM</div>
                {['Dashboard', 'Pipeline', 'Jobs', 'Dispatch', 'Billing'].map((s, i) => (
                  <div key={s} className={'lp-mock-navitem' + (i === 0 ? ' on' : '')}>{s}</div>
                ))}
              </div>
              <div className="lp-mock-main">
                <div className="lp-mock-kpis">
                  {[['New leads', '38'], ['Booked', '21'], ['Cash collected', '$47.2k'], ['Conversion', '55%']].map(([l, v]) => (
                    <div key={l} className="lp-mock-kpi"><span>{l}</span><strong>{v}</strong></div>
                  ))}
                </div>
                <div className="lp-mock-board">
                  {['Lead', 'Opportunity', 'Booked', 'In Progress'].map((c) => (
                    <div key={c} className="lp-mock-col">
                      <div className="lp-mock-coltitle">{c}</div>
                      <div className="lp-mock-jobcard" />
                      <div className="lp-mock-jobcard short" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="lp-stats">
        <div className="lp-container lp-stats-grid">
          {STATS.map((s) => (
            <div key={s.label} className="lp-stat">
              <div className="lp-stat-val">{s.value}</div>
              <div className="lp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="lp-section">
        <div className="lp-container">
          <div className="lp-section-head">
            <h2>Everything it takes to run the move</h2>
            <p>One login replaces the spreadsheets, the whiteboard, and the three tools that don’t talk to each other.</p>
          </div>
          <div className="lp-feature-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="lp-feature">
                <div className="lp-feature-icon"><f.icon size={20} /></div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="lp-section lp-section-alt">
        <div className="lp-container">
          <div className="lp-section-head">
            <h2>Simple pricing that scales with you</h2>
            <p>Start free for 14 days. Upgrade when you’re ready — cancel any time.</p>
          </div>
          <div className="lp-price-grid">
            {PLANS.map((p) => (
              <div key={p.name} className={'lp-price' + (p.featured ? ' featured' : '')}>
                {p.featured && <span className="lp-price-tag">Most popular</span>}
                <h3>{p.name}</h3>
                <div className="lp-price-amount">{p.price}<span>{p.unit}</span></div>
                <div className="lp-price-blurb">{p.blurb}</div>
                <ul>
                  {p.features.map((ft) => <li key={ft}><Check size={15} /> {ft}</li>)}
                </ul>
                <Link to="/signup" className={'btn lp-btn-lg ' + (p.featured ? 'primary' : '')} style={{ width: '100%', justifyContent: 'center' }}>
                  Start free
                </Link>
              </div>
            ))}
          </div>
          <p className="lp-price-note">Need multiple locations or something custom? <a href={CALENDLY} target="_blank" rel="noreferrer">Talk to us →</a></p>
        </div>
      </section>

      {/* CTA band */}
      <section className="lp-cta">
        <div className="lp-glow lp-glow-c" />
        <div className="lp-container lp-cta-inner">
          <h2>See Move CRM run your business in 30 minutes</h2>
          <p>Book a live demo and we’ll set it up around your exact workflow — no pressure, just a look.</p>
          <div className="lp-hero-cta">
            <a href={CALENDLY} target="_blank" rel="noreferrer" className="btn primary lp-btn-lg">
              <CalendarClock size={18} /> Book your demo
            </a>
            <Link to="/signup" className="btn lp-btn-lg lp-btn-ghost">Or start free <ArrowRight size={18} /></Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div className="lp-brand"><Truck size={20} /> Move CRM</div>
          <div className="lp-footer-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href={CALENDLY} target="_blank" rel="noreferrer">Book a demo</a>
            <Link to="/login">Sign in</Link>
            <Link to="/owner"><ShieldCheck size={14} style={{ verticalAlign: '-2px' }} /> Owner</Link>
          </div>
          <div className="lp-footer-copy">© {new Date().getFullYear()} Move CRM. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
