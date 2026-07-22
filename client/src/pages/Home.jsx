import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck, ArrowRight, CalendarClock, LayoutDashboard, KanbanSquare, Calculator,
  Route as RouteIcon, Receipt, Star, PhoneCall, BarChart3, Check, Zap,
  Wallet, Layers, Plug, Gauge, Heart, ChevronDown, Sparkles, Clock,
  CheckCircle2, MessageSquare, ShieldCheck,
} from 'lucide-react';

const CALENDLY = 'https://calendly.com/mzseoconsultant/30min';

const MARQUEE = [
  'Sales Pipeline', 'Estimating', 'Dispatch', 'Crews & Trucks', 'Billing',
  'Lead Capture', 'Call Tracking', 'Reviews', 'Analytics', 'Tasks', 'Calendar', 'Reporting',
];

const FEATURES = [
  { icon: KanbanSquare, title: 'Sales pipeline', desc: 'Drag and drop Kanban from first call to booked job, so no lead ever slips through.' },
  { icon: Calculator, title: 'Instant estimating', desc: 'Line item quotes off a configurable tariff that total themselves in seconds.' },
  { icon: RouteIcon, title: 'Dispatch & crews', desc: 'A live day board with real time crew and truck availability at a glance.' },
  { icon: Receipt, title: 'Billing that closes', desc: 'Invoices from estimates, card, cash and ACH payments, balances tracked automatically.' },
  { icon: PhoneCall, title: 'Calls become leads', desc: 'Inbound calls are answered, recorded and turned into leads without lifting a finger.' },
  { icon: Star, title: 'Reputation on autopilot', desc: 'Finished jobs auto request reviews and route your happiest customers to Google.' },
  { icon: BarChart3, title: 'Reports that decide', desc: 'Lead source ROI, salesperson performance and cash collected, the numbers that matter.' },
  { icon: LayoutDashboard, title: 'One clean dashboard', desc: 'Bookings, moves today, cash collected and conversion rate the moment you log in.' },
];

const STATS = [
  { value: '20+', label: 'Modules in one app' },
  { value: '5 min', label: 'To your first quote' },
  { value: '~50%', label: 'Less than other platforms' },
  { value: '100%', label: 'Multi tenant and secure' },
];

const WHY = [
  { icon: Wallet, title: 'Half the price', desc: 'Everything the big moving CRM platforms charge a premium for, at roughly half the budget. More margin stays in your pocket.' },
  { icon: Layers, title: 'One app, not ten', desc: 'Pipeline, estimating, dispatch, crews, billing, reviews and reporting live together. No stitching tools that do not talk to each other.' },
  { icon: Plug, title: 'Leads flow in on their own', desc: 'A hosted quote page, embeddable form, webhook and phone answering turn website visits and calls into leads automatically.' },
  { icon: Gauge, title: 'Guided setup, live fast', desc: 'After a short demo we set up your workspace, tariff and lead sources with you, so you can send your first quote the same day.' },
  { icon: Star, title: 'Reputation built in', desc: 'Finished jobs auto request reviews and route happy customers to Google, with no extra reputation tool to buy.' },
  { icon: Truck, title: 'Made for movers only', desc: 'Move sizes, cubic feet, crews, trucks, long distance versus local. The language and workflow of a moving company, not generic sales software.' },
];

const DEMO_POINTS = [
  { icon: Truck, title: 'Set up around your business', desc: 'We tailor the walkthrough to your services, crews and pricing, not a canned demo reel.' },
  { icon: MessageSquare, title: 'Every question answered live', desc: 'Ask anything about switching, importing your data, or how a workflow maps into Movers CRM.' },
  { icon: Clock, title: 'Just 30 minutes', desc: 'A focused, no pressure session. Come see it run, then decide in your own time.' },
  { icon: Sparkles, title: 'Leave with a clear plan', desc: 'You walk away knowing exactly how to switch in days, and what it saves you every month.' },
];

const FAQS = [
  { q: 'How is Movers CRM cheaper than other moving CRMs?', a: 'We built Movers CRM lean and pass the savings on. You get the same core toolkit the established platforms sell, pipeline, estimating, dispatch, billing and reviews, for roughly half the monthly cost, with no setup fees and no long contracts.' },
  { q: 'How do I get started?', a: 'Book a quick demo. We set up your workspace for you and walk you through it, so you start with the right plan and a guided onboarding rather than a self-serve sign-up form.' },
  { q: 'Is my company data private?', a: 'Yes. Movers CRM is fully multi tenant, so every record is scoped to your organization and no other company can ever see your leads, customers or jobs.' },
  { q: 'Can I capture leads from my existing website?', a: 'Absolutely. Each company gets a hosted quote page, an embeddable form for your site, and a webhook for Zapier or lead providers. Inbound phone calls can be answered and turned into leads too.' },
  { q: 'What kinds of moves does it handle?', a: 'Local, long distance, commercial, storage and labor only jobs, with move sizes, cubic feet inventory, crews and trucks built for the way movers actually work.' },
  { q: 'How do I see it before committing?', a: 'Book a free 30 minute demo and we will walk through Movers CRM set up around your exact workflow. It is the fastest way to know if it fits your business.' },
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
          <Link to="/" className="lp-brand"><Truck size={24} /> Movers CRM</Link>
          <nav className="lp-nav-links">
            <a href="#why">Why Movers CRM</a>
            <a href="#features">Features</a>
            <a href="#story">Our Story</a>
            <a href="#faq">FAQ</a>
            <Link to="/login">Sign in</Link>
            <a href={CALENDLY} target="_blank" rel="noreferrer" className="btn primary lp-nav-cta">Book a demo</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-grid-overlay" />
        <div className="lp-glow lp-glow-a" />
        <div className="lp-glow lp-glow-b" />
        <div className="lp-container lp-hero-inner">
          <span className="lp-pill lp-reveal"><Zap size={13} /> The operating system for moving companies</span>
          <h1 className="lp-reveal lp-d1">Move faster.<br /><span className="lp-grad">Book more moves.</span></h1>
          <p className="lp-sub lp-reveal lp-d2">
            Movers CRM runs your whole moving company in one place: leads, estimates, dispatch,
            crews, billing and reviews. Less busywork, more booked jobs, at about half the cost
            of the other platforms.
          </p>
          <div className="lp-hero-cta lp-reveal lp-d3">
            <a href={CALENDLY} target="_blank" rel="noreferrer" className="btn primary lp-btn-lg lp-btn-glow">
              <CalendarClock size={18} /> Book a free demo
            </a>
            <a href="#features" className="btn lp-btn-lg lp-btn-ghost">See how it works <ArrowRight size={18} /></a>
          </div>
          <div className="lp-trust lp-reveal lp-d3"><Check size={15} /> Personalized setup around your business, no pressure</div>

          {/* Product mock */}
          <div className="lp-mock lp-reveal lp-d4">
            <div className="lp-mock-bar"><span /><span /><span /></div>
            <div className="lp-mock-body">
              <div className="lp-mock-side">
                <div className="lp-mock-logo"><Truck size={16} /> Movers CRM</div>
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

        {/* Marquee of modules */}
        <div className="lp-marquee">
          <div className="lp-marquee-track">
            {[...MARQUEE, ...MARQUEE].map((m, i) => (
              <span key={i} className="lp-marquee-item"><Sparkles size={13} /> {m}</span>
            ))}
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

      {/* Why Movers CRM */}
      <section id="why" className="lp-section">
        <div className="lp-container">
          <div className="lp-section-head">
            <span className="lp-eyebrow">Why Movers CRM</span>
            <h2>Why moving companies choose Movers CRM</h2>
            <p>The full toolkit the big platforms sell, without the enterprise price tag or the ten tool tangle.</p>
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
            <span className="lp-eyebrow">Features</span>
            <h2>Everything it takes to run the move</h2>
            <p>One login replaces the spreadsheets, the whiteboard, and the three tools that do not talk to each other.</p>
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
              <div className="lp-story-quote">“Great software should not be a luxury only the biggest movers can afford.”</div>
              <div className="lp-story-stat"><strong>~50%</strong><span>less than other moving CRM platforms</span></div>
            </div>
          </div>
          <div className="lp-story-copy">
            <h2>Built to give every moving company a fair shot</h2>
            <p>
              I kept meeting moving company owners running a serious business off scattered
              spreadsheets, sticky notes and a whiteboard, because the real moving CRM platforms
              were priced for the giants, not the growing crew doing the actual moves.
            </p>
            <p>
              So I set out to build Movers CRM: one place where a moving company can manage all of
              its data, leads, estimates, dispatch, crews, billing and reviews, the way it
              actually works day to day, at almost half the budget of the other platforms out there.
            </p>
            <p>
              No enterprise sales calls, no bloated feature lists you will never touch. Just the
              tools that book more moves and keep the office running, priced so any moving company
              can afford to run better.
            </p>
            <div className="lp-hero-cta" style={{ marginTop: 26, justifyContent: 'flex-start' }}>
              <a href={CALENDLY} target="_blank" rel="noreferrer" className="btn primary lp-btn-lg">
                <CalendarClock size={18} /> Book a demo
              </a>
              <a href="#faq" className="btn lp-btn-lg">Read the FAQ <ArrowRight size={18} /></a>
            </div>
          </div>
        </div>
      </section>

      {/* Demo (replaces pricing) */}
      <section id="demo" className="lp-section lp-section-alt">
        <div className="lp-container">
          <div className="lp-section-head">
            <span className="lp-eyebrow">See it live</span>
            <h2>The fastest way to see if Movers CRM fits</h2>
            <p>Book a free 30 minute demo. We set it up around your business and show you exactly how it books more moves for less.</p>
          </div>
          <div className="lp-demo">
            <div className="lp-demo-points">
              {DEMO_POINTS.map((d) => (
                <div key={d.title} className="lp-demo-point">
                  <div className="lp-demo-ic"><d.icon size={20} /></div>
                  <div>
                    <h3>{d.title}</h3>
                    <p>{d.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="lp-demo-card">
              <div className="lp-glow lp-glow-d" />
              <div className="lp-demo-card-inner">
                <div className="lp-demo-badge"><CalendarClock size={15} /> Free 30 min demo</div>
                <h3>Ready in one call</h3>
                <ul className="lp-demo-list">
                  <li><CheckCircle2 size={16} /> Live walkthrough of your workflow</li>
                  <li><CheckCircle2 size={16} /> Honest answers, zero pressure</li>
                  <li><CheckCircle2 size={16} /> A plan to switch in days</li>
                  <li><CheckCircle2 size={16} /> See the savings for yourself</li>
                </ul>
                <a href={CALENDLY} target="_blank" rel="noreferrer" className="btn primary lp-btn-lg lp-btn-glow" style={{ width: '100%', justifyContent: 'center' }}>
                  Book your demo now <ArrowRight size={18} />
                </a>
                <div className="lp-demo-note"><Check size={14} /> Prefer to learn more first? <a href="#faq">Read the FAQ</a></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="lp-section">
        <div className="lp-container lp-faq-wrap">
          <div className="lp-section-head">
            <span className="lp-eyebrow">FAQ</span>
            <h2>Frequently asked questions</h2>
            <p>Everything you need to know before you start. Still curious? <a href={CALENDLY} target="_blank" rel="noreferrer">Book a demo.</a></p>
          </div>
          <div className="lp-faq-list">
            {FAQS.map((f) => <Faq key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="lp-cta">
        <div className="lp-glow lp-glow-c" />
        <div className="lp-grid-overlay" />
        <div className="lp-container lp-cta-inner">
          <span className="lp-pill"><ShieldCheck size={13} /> No card, no risk, no pressure</span>
          <h2>See Movers CRM run your business in 30 minutes</h2>
          <p>Book a live demo and we will set it up around your exact workflow. Come see how much simpler and cheaper running your moving company can be.</p>
          <div className="lp-hero-cta">
            <a href={CALENDLY} target="_blank" rel="noreferrer" className="btn primary lp-btn-lg lp-btn-glow">
              <CalendarClock size={18} /> Book your free demo
            </a>
            <a href="#features" className="btn lp-btn-lg lp-btn-ghost">Or see features <ArrowRight size={18} /></a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div className="lp-brand"><Truck size={20} /> Movers CRM</div>
          <div className="lp-footer-links">
            <a href="#why">Why Movers CRM</a>
            <a href="#features">Features</a>
            <a href="#story">Our Story</a>
            <a href="#faq">FAQ</a>
            <a href={CALENDLY} target="_blank" rel="noreferrer">Book a demo</a>
            <Link to="/login">Sign in</Link>
          </div>
          <div className="lp-footer-copy">© {new Date().getFullYear()} Movers CRM. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
