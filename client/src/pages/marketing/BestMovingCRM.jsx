import { Link } from 'react-router-dom';
import { CalendarClock, Check, ArrowRight } from 'lucide-react';
import MarketingLayout, { CALENDLY } from '../../components/MarketingLayout.jsx';
import { useSeo } from '../../lib/seo.js';

const CHECKLIST = [
  'Built specifically for moving companies, not generic sales software',
  'One app for pipeline, estimating, dispatch, billing and reviews',
  'Affordable pricing that fits small and midsize movers',
  'Lead capture and call tracking with marketing attribution',
  'Fast, done-for-you onboarding and data import',
  'No long contracts or surprise fees',
];

export default function BestMovingCRM() {
  useSeo({
    title: 'Best CRM For Moving Companies | Movers CRM',
    description:
      'Movers CRM is the best value CRM for moving companies: pipeline, estimating, dispatch, invoicing and reviews in one affordable app. Book a demo.',
    path: '/best-crm-for-moving-companies',
  });

  return (
    <MarketingLayout>
      <section className="mkt-hero">
        <div className="lp-glow lp-glow-b" />
        <div className="lp-container mkt-hero-inner">
          <span className="lp-pill">Best CRM for movers</span>
          <h1>The best CRM for moving companies that need results, not overhead</h1>
          <p className="mkt-lead">
            Movers CRM is the moving company software that runs your whole business in one place, at a price
            that makes sense. Capture more leads, quote faster, dispatch smarter and get paid sooner, without
            paying enterprise rates.
          </p>
          <div className="mkt-cta">
            <a href={CALENDLY} target="_blank" rel="noreferrer" className="btn primary lp-btn-lg lp-btn-glow">
              <CalendarClock size={18} /> Book a free demo
            </a>
            <Link to="/smartmoving-alternative" className="btn lp-btn-lg lp-btn-ghost">Compare to SmartMoving <ArrowRight size={18} /></Link>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container mkt-prose">
          <h2>What makes the best CRM for a moving company</h2>
          <p>
            The best CRM for moving companies is not the one with the longest feature list. It is the one your
            team actually uses every day, that turns more inquiries into booked moves, and that pays for itself
            quickly. A moving business runs on fast quotes, tight dispatch and clean billing, so the right CRM
            has to handle move sizes, cubic feet, crews, trucks and long distance versus local out of the box.
          </p>
          <p>
            Movers CRM is built for exactly this. It replaces the spreadsheets, the whiteboard and the three
            disconnected tools most movers juggle, and puts leads, estimates, dispatch, invoicing and reviews
            under one login. That is why growing movers choose Movers CRM as their moving company CRM.
          </p>

          <h2>What to look for when you compare moving CRMs</h2>
          <ul className="mkt-check">
            {CHECKLIST.map((c) => <li key={c}><Check size={17} /> {c}</li>)}
          </ul>

          <h2>Everything a moving company needs, in one place</h2>
          <p>
            Your sales pipeline keeps every lead moving from first call to booked job. Estimating builds line
            item quotes off your own tariff and totals them instantly. Dispatch shows a live day board with
            real time crew and truck availability. Billing turns estimates into invoices, records payments and
            tracks balances. Reputation tools request a review after every completed move and send happy
            customers to Google. Reporting shows lead source ROI, salesperson performance and cash collected.
          </p>
          <p>
            Movers CRM also brings the leads to you. Use the hosted quote form, embed the widget on your
            website, or connect WhatConverts and MarketingClarity so every tracked call and form becomes an
            attributed lead in your pipeline automatically.
          </p>

          <h2>Affordable pricing built for movers</h2>
          <p>
            Great software should not be a luxury only the biggest movers can afford. Movers CRM delivers the
            core toolkit the established platforms sell for about half the cost, with fast onboarding and no
            long contracts. You get a guided setup, your data imported for you, and a team that is live within
            days.
          </p>

          <div className="mkt-cta-band">
            <h2>Ready to run your moving company on one affordable CRM?</h2>
            <p>Book a free demo and we will set up Movers CRM around your business.</p>
            <a href={CALENDLY} target="_blank" rel="noreferrer" className="btn primary lp-btn-lg lp-btn-glow">
              <CalendarClock size={18} /> Book your demo
            </a>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
