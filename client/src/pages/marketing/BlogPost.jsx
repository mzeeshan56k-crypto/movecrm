import { useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, CalendarClock } from 'lucide-react';
import MarketingLayout, { CALENDLY } from '../../components/MarketingLayout.jsx';
import { useSeo, SITE } from '../../lib/seo.js';
import { getPost, POSTS } from './blogData.js';

const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

export default function BlogPost() {
  const { slug } = useParams();
  const post = getPost(slug);

  useSeo(post ? {
    title: `${post.title} | Movers CRM`,
    description: post.description,
    path: `/blog/${post.slug}`,
  } : {});

  // Structured data for rich results and AI answer engines: BlogPosting always,
  // plus FAQPage when the article carries a real question and answer section.
  useEffect(() => {
    if (!post) return;
    const blocks = [{
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.updated || post.date,
      author: { '@type': 'Organization', name: post.author || 'Movers CRM' },
      publisher: { '@type': 'Organization', name: 'Movers CRM' },
      mainEntityOfPage: `${SITE}/blog/${post.slug}`,
      keywords: post.keyword,
    }];
    if (post.faqs?.length) {
      blocks.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: post.faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      });
    }
    const nodes = blocks.map((b) => {
      const el = document.createElement('script');
      el.type = 'application/ld+json';
      el.textContent = JSON.stringify(b);
      document.head.appendChild(el);
      return el;
    });
    return () => { nodes.forEach((n) => document.head.removeChild(n)); };
  }, [post]);

  if (!post) return <Navigate to="/blog" replace />;

  // Related reading: prefer posts this one already links to contextually.
  const linked = POSTS.filter((p) => p.slug !== post.slug && post.body.includes(`/blog/${p.slug}`));
  const related = [...linked, ...POSTS.filter((p) => p.slug !== post.slug && !linked.includes(p))].slice(0, 3);

  return (
    <MarketingLayout>
      <article className="lp-section blog-post">
        <div className="lp-container blog-post-inner">
          <Link to="/blog" className="blog-back"><ArrowLeft size={15} /> All guides</Link>
          <div className="blog-meta">
            {fmt(post.date)} · {post.read} min read
            {post.author ? ` · By ${post.author}` : ''}
          </div>
          <h1>{post.title}</h1>
          {post.updated && post.updated !== post.date && (
            <div className="blog-updated">Last updated {fmt(post.updated)}</div>
          )}

          {post.tldr && (
            <div className="blog-tldr">
              <span className="blog-tldr-label">Summary</span>
              <p>{post.tldr}</p>
            </div>
          )}

          <div className="blog-content" dangerouslySetInnerHTML={{ __html: post.body }} />

          {post.faqs?.length > 0 && (
            <section className="blog-faq">
              <h2>Frequently asked questions</h2>
              {post.faqs.map((f) => (
                <div key={f.q} className="blog-faq-item">
                  <h3>{f.q}</h3>
                  <p>{f.a}</p>
                </div>
              ))}
            </section>
          )}

          <div className="mkt-cta-band">
            <h2>See Movers CRM for your moving company</h2>
            <p>Book a free demo and we will set it up around your exact workflow, at about half the cost of other platforms.</p>
            <a href={CALENDLY} target="_blank" rel="noreferrer" className="btn primary lp-btn-lg lp-btn-glow">
              <CalendarClock size={18} /> Book your demo
            </a>
          </div>

          <div className="blog-related">
            <h3>Related guides</h3>
            <ul>
              {related.map((p) => (
                <li key={p.slug}><Link to={`/blog/${p.slug}`}>{p.title}</Link></li>
              ))}
            </ul>
          </div>
        </div>
      </article>
    </MarketingLayout>
  );
}
