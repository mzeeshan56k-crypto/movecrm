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

  // Inject Article structured data for rich results; remove on unmount.
  useEffect(() => {
    if (!post) return;
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.date,
      author: { '@type': 'Organization', name: 'Movers CRM' },
      publisher: { '@type': 'Organization', name: 'Movers CRM' },
      mainEntityOfPage: `${SITE}/blog/${post.slug}`,
      keywords: post.keyword,
    });
    document.head.appendChild(ld);
    return () => { document.head.removeChild(ld); };
  }, [post]);

  if (!post) return <Navigate to="/blog" replace />;

  const related = POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <MarketingLayout>
      <article className="lp-section blog-post">
        <div className="lp-container blog-post-inner">
          <Link to="/blog" className="blog-back"><ArrowLeft size={15} /> All guides</Link>
          <div className="blog-meta">{fmt(post.date)} · {post.read} min read</div>
          <h1>{post.title}</h1>
          <div className="blog-content" dangerouslySetInnerHTML={{ __html: post.body }} />

          <div className="mkt-cta-band">
            <h2>See Movers CRM for your moving company</h2>
            <p>Book a free demo and we will set it up around your exact workflow, at about half the cost of other platforms.</p>
            <a href={CALENDLY} target="_blank" rel="noreferrer" className="btn primary lp-btn-lg lp-btn-glow">
              <CalendarClock size={18} /> Book your demo
            </a>
          </div>

          <div className="blog-related">
            <h3>More guides</h3>
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
