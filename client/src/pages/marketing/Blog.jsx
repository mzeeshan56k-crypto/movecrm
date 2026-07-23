import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock } from 'lucide-react';
import MarketingLayout, { CALENDLY } from '../../components/MarketingLayout.jsx';
import { useSeo } from '../../lib/seo.js';
import { POSTS } from './blogData.js';

const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function Blog() {
  useSeo({
    title: 'Movers CRM Blog | CRM & Software Tips for Moving Companies',
    description:
      'Guides on CRM software, lead management and pricing for moving companies. Learn how to book more moves with Movers CRM.',
    path: '/blog',
  });

  return (
    <MarketingLayout>
      <section className="mkt-hero mkt-hero-sm">
        <div className="lp-glow lp-glow-a" />
        <div className="lp-container mkt-hero-inner">
          <span className="lp-pill">Movers CRM blog</span>
          <h1>Guides to grow your moving company</h1>
          <p className="mkt-lead">
            Practical advice on choosing CRM software, managing leads and booking more moves, written for
            moving company owners.
          </p>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container">
          <div className="blog-grid">
            {POSTS.map((p) => (
              <article key={p.slug} className="blog-card">
                <div className="blog-card-body">
                  <div className="blog-meta">{fmt(p.date)} · {p.read} min read</div>
                  <h2><Link to={`/blog/${p.slug}`}>{p.title}</Link></h2>
                  <p>{p.description}</p>
                  <Link to={`/blog/${p.slug}`} className="blog-readmore">Read guide <ArrowRight size={15} /></Link>
                </div>
              </article>
            ))}
          </div>

          <div className="mkt-cta-band" style={{ marginTop: 40 }}>
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
