import { Link } from 'react-router-dom';
import { CalendarClock, Check, X, ArrowRight } from 'lucide-react';
import MarketingLayout, { CALENDLY } from '../../components/MarketingLayout.jsx';
import { useSeo } from '../../lib/seo.js';

const ROWS = [
  ['Pricing', 'Affordable, about half the cost', 'Premium enterprise pricing'],
  ['Best for', 'Small and midsize moving companies', 'Larger operators'],
  ['Onboarding', 'Done-for-you setup on a call', 'Self-serve or paid onboarding'],
  ['Sales pipeline', 'Included', 'Included'],
  ['Estimating and invoicing', 'Included', 'Included'],
  ['Dispatch and crews', 'Included', 'Included'],
  ['Reviews and reputation', 'Built in', 'Add-on or separate tool'],
  ['WhatConverts lead tracking', 'Native integration', 'Supported'],
  ['Contract', 'No long lock-in', 'Annual contracts common'],
];

export default function SmartMovingAlternative() {
  useSeo({
    title: 'SmartMoving Alternative | Movers CRM for Moving Companies',
    description:
      'Looking for a SmartMoving alternative? Movers CRM gives moving companies the same pipeline, dispatch and billing tools at about half the cost. Book a demo.',
    path: '/smartmoving-alternative',
  });

  return (
    <MarketingLayout>
      <section className="mkt-hero">
        <div className="lp-glow lp-glow-a" />
        <div className="lp-container mkt-hero-inner">
          <span className="lp-pill">SmartMoving alternative</span>
          <h1>The affordable SmartMoving alternative for moving companies</h1>
          <p className="mkt-lead">
            Movers CRM gives your moving company the same core tools you expect from SmartMoving, sales
            pipeline, estimating, dispatch, invoicing, reviews and lead tracking, for about half the cost.
            No long contracts, and we set it up for you.
          </p>
          <div className="mkt-cta">
            <a href={CALENDLY} target="_blank" rel="noreferrer" className="btn primary lp-btn-lg lp-btn-glow">
              <CalendarClock size={18} /> Book a free demo
            </a>
            <Link to="/best-crm-for-moving-companies" className="btn lp-btn-lg lp-btn-ghost">See why we are different <ArrowRight size={18} /></Link>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container mkt-prose">
          <h2>Why moving companies look for a SmartMoving alternative</h2>
          <p>
            SmartMoving is a capable platform, but many moving companies find the pricing built for large
            operators rather than the growing crew doing the daily moves. When the monthly cost climbs faster
            than the number of jobs, owners start looking for moving company software that delivers the same
            results without the enterprise price tag. That is exactly where Movers CRM fits.
          </p>
          <p>
            Movers CRM was built to run a moving company end to end in one place. You capture leads, send
            quotes, book jobs, dispatch crews and trucks, invoice, collect payments and gather reviews, all
            from a single login. You get the workflow of a modern moving CRM at a price a small or midsize
            mover can actually afford.
          </p>

          <h2>Movers CRM vs SmartMoving at a glance</h2>
          <div className="mkt-table-wrap">
            <table className="mkt-table">
              <thead>
                <tr><th>Feature</th><th>Movers CRM</th><th>SmartMoving</th></tr>
              </thead>
              <tbody>
                {ROWS.map(([f, a, b]) => (
                  <tr key={f}>
                    <td>{f}</td>
                    <td className="mkt-yes"><Check size={15} /> {a}</td>
                    <td className="mkt-muted">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mkt-note">
            Comparison reflects typical positioning and is provided to help you evaluate options. SmartMoving
            is a trademark of its owner and is not affiliated with Movers CRM.
          </p>

          <h2>What you get with Movers CRM</h2>
          <p>
            Every plan includes the full toolkit, not a stripped down starter. Your sales team works leads on
            a drag and drop pipeline. Estimators build line item quotes off a configurable tariff that totals
            itself. Dispatchers assign crews and trucks on a live day board. The office sends invoices,
            records card, cash and ACH payments, and tracks balances automatically. After each move, Movers
            CRM asks for a review and routes happy customers to Google.
          </p>
          <p>
            Movers CRM also captures leads for you. A hosted quote form, an embeddable widget and a lead
            webhook turn website visits into leads, and a native WhatConverts integration brings every tracked
            call and form into your pipeline with full marketing attribution. If you are switching from
            SmartMoving, you can import your customers and jobs from a CSV in one step.
          </p>

          <h2>Switching from SmartMoving is simple</h2>
          <p>
            You do not have to figure it out alone. Book a short demo and we will map your current workflow
            into Movers CRM, import your data, set up your tariff and lead sources, and get your team logged
            in. Most moving companies are live within days, not months, and start booking moves the same week.
          </p>

          <div className="mkt-cta-band">
            <h2>See the affordable SmartMoving alternative in action</h2>
            <p>Book a free demo and we will set up Movers CRM around your exact moving business.</p>
            <a href={CALENDLY} target="_blank" rel="noreferrer" className="btn primary lp-btn-lg lp-btn-glow">
              <CalendarClock size={18} /> Book your demo
            </a>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
