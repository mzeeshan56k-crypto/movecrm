import { useEffect } from 'react';

export const SITE = 'https://moverscrm.org';
const DEFAULT_TITLE = 'Movers CRM | Affordable CRM For Moving Companies';
const DEFAULT_DESC =
  'Affordable all-in-one CRM for moving companies. Capture leads, quote, dispatch, invoice and collect reviews at about half the cost. Book a demo.';

function upsertMeta(attr, name, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

// Sets the document title, meta description, canonical and Open Graph tags for a
// page, then restores the site defaults when leaving. Keeps client-routed
// marketing and blog pages properly indexed.
export function useSeo({ title, description, path = '/' } = {}) {
  useEffect(() => {
    const t = title || DEFAULT_TITLE;
    const d = description || DEFAULT_DESC;
    const url = SITE + path;
    document.title = t;
    upsertMeta('name', 'description', d);
    upsertCanonical(url);
    upsertMeta('property', 'og:title', t);
    upsertMeta('property', 'og:description', d);
    upsertMeta('property', 'og:url', url);
    return () => {
      document.title = DEFAULT_TITLE;
      upsertMeta('name', 'description', DEFAULT_DESC);
      upsertCanonical(SITE + '/');
    };
  }, [title, description, path]);
}
