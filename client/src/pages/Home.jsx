import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck, ArrowRight, CalendarClock, LayoutDashboard, KanbanSquare, Calculator,
  Route as RouteIcon, Receipt, Star, PhoneCall, BarChart3, Check, Zap,
  Wallet, Layers, Plug, Gauge, Heart, ChevronDown,
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

const WHY = [
  { icon: Wallet, title: 'Half the price', desc: 'Everything the big moving-CRM platforms charge a premium for — at roughly half the budget. More margin stays in your pocket.' },
  { icon: Layers, title: 'One app, not ten', desc: 'Pipeline, estimating, dispatch, crews, billing, reviews and reporting live together. No stitching tools that don’t talk to each other.' },
  { icon: Plug, title: 'Leads flow in on their own', desc: 'A hosted quote page, embeddable form, webhook, and phone answering turn website visits and calls into leads automatically.' },
  { icon: Gauge, title: 'Live in minutes', desc: 'Self-serve signup provisions your workspace, tariff, and lead sources instantly. Send your first quote the same afternoon.' },
  { icon: Star, title: 'Reputation built in', desc: 'Finished jobs auto-request reviews and route happy customers to Google — no extra reputation tool to buy.' },
  { icon: Truck, title: 'Made for movers only', desc: 'Move sizes, cubic feet, crews, trucks, long-distance vs local — the language and workflow of a moving company, not generic sales software.' },
];

const FAQS = [
  { q: 'How is Move CRM cheaper than other moving CRMs?', a: 'We built Move CRM lean and pass the savings on. You get the same core toolkit the established platforms sell — pipeline, estimating, dispatch, billing, reviews — for roughly half the monthly cost, with no setup fees and no long contracts.' },
  { q: 'Do I need a credit card to start?', a: 'No. Every company starts on a 14-day free trial with no credit card. Add a payment method only when you decide to keep going.' },
  { q: 'Is my company’s data private?', a: 'Yes. Move CRM is fully multi-tenant — every record is scoped to your organization, so no other company can ever see your leads, customers, or jobs.' },
  { q: 'Can I capture leads from my existing website?', a: 'Absolutely. Each company gets a hosted quote page, an embeddable form for your site, and a webhook for Zapier or lead providers. Inbound phone calls can be answered and turned into leads too.' },
  { q: 'What kinds of moves does it handle?', a: 'Local, long-distance, commercial, storage, and labor-only jobs — with move sizes, cubic-feet inventory, crews, and trucks built for the way movers actually work.' },
  { q: 'Can I see it before committing?', a: 'Yes — book a free 30-minute demo and we’ll walk through Move CRM set up around your exact workflow, or just start the free trial and explore it yourself.' },
];

function Faq({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={'lp-faq' + (open ? ' open' : '')}>
      <button type="button" className="lp-faq-q" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>{q}</span>
        <ChevronDown size={18} className="lp-faq-chev" />
      </button>
      {open && <div className="lp-faq-a">{a}</div>}
    </div>
  );
}

export default function Home() {
  return (
    <div className="landing">
      {/* Nav */}
      <header className="lp-nav">
        <div className="lp-container lp-nav-inner">
          <Link to="/" className="lp-brand"><Truck size={24} /> Move CRM</Link>
          <nav className="lp-nav-links">
            <a href="#why">Why Move CRM</a>
            <a href="#features">Features</a>
            <a href="#story">Our Story</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
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

      {/* Why Move CRM */}
      <section id="why" className="lp-section">
        <div className="lp-container">
          <div className="lp-section-head">
            <h2>Why moving companies choose Move CRM</h2>
            <p>The full toolkit the big platforms sell — without the enterprise price tag or the ten-tool tangle.</p>
          </div>
          <div className="lp-why-grid">
            {WHY.map((w) => (
              <div key={w.title} className="lp-why">
                <div className="lp-why-icon"><w.icon size={22} /></div>
                <div>
                  <h3>{w.title}</h3>
                  <p>{w.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="lp-section lp-section-alt">
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

      {/* Our Story */}
      <section id="story" className="lp-section">
        <div className="lp-container lp-story">
          <div className="lp-story-media">
            <div className="lp-story-badge"><Heart size={16} /> Our Story</div>
            <div className="lp-story-card">
              <div className="lp-story-quote">“Great software shouldn’t be a luxury only the biggest movers can afford.”</div>
              <div className="lp-story-stat"><strong>~50%</strong><span>less than other moving-CRM platforms</span></div>
            </div>
          </div>
          <div className="lp-story-copy">
            <h2>Built to give every moving company a fair shot</h2>
            <p>
              I kept meeting moving-company owners running a serious business off scattered
              spreadsheets, sticky notes, and a whiteboard — because the “real” moving-CRM
              platforms were priced for the giants, not the growing crew doing the actual moves.
            </p>
            <p>
              So I set out to build Move CRM: one place where a moving company can manage all of
              its data — leads, estimates, dispatch, crews, billing, and reviews — the way it
              actually works day to day, at <strong>almost half the budget</strong> of the other
              platforms out there.
            </p>
            <p>
              No enterprise sales calls, no bloated feature lists you’ll never touch. Just the
              tools that book more moves and keep the office running — priced so any moving
              company can afford to run better.
            </p>
            <div className="lp-hero-cta" style={{ marginTop: 26, justifyContent: 'flex-start' }}>
              <Link to="/signup" className="btn primary lp-btn-lg">Start free <ArrowRight size={18} /></Link>
              <a href={CALENDLY} target="_blank" rel="noreferrer" className="btn lp-btn-lg">
                <CalendarClock size={18} /> Book a demo
              </a>
            </div>
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

      {/* FAQ */}
      <section id="faq" className="lp-section">
        <div className="lp-container lp-faq-wrap">
          <div className="lp-section-head">
            <h2>Frequently asked questions</h2>
            <p>Everything you need to know before you start. Still curious? <a href={CALENDLY} target="_blank" rel="noreferrer">Book a demo →</a></p>
          </div>
          <div className="lp-faq-list">
            {FAQS.map((f) => <Faq key={f.q} q={f.q} a={f.a} />)}
          </div>
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
            <a href="#why">Why Move CRM</a>
            <a href="#features">Features</a>
            <a href="#story">Our Story</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <a href={CALENDLY} target="_blank" rel="noreferrer">Book a demo</a>
            <Link to="/login">Sign in</Link>
          </div>
          <div className="lp-footer-copy">© {new Date().getFullYear()} Move CRM. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
