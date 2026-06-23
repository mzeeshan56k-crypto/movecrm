import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Star, CheckCircle, Truck } from 'lucide-react';

// Public review page — what a customer sees after their move. 4-5 stars are
// routed to Google; lower ratings are captured privately for the company.
export default function PublicReview() {
  const { token } = useParams();
  const [info, setInfo] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/public/review/${token}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setInfo)
      .catch(() => setNotFound(true));
  }, [token]);

  const submit = async () => {
    if (!rating) return;
    setBusy(true);
    const res = await fetch(`/api/public/review/${token}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment }),
    }).then((r) => r.json());
    setDone(res);
    setBusy(false);
    if (res.google_review_url) {
      setTimeout(() => { window.location.href = res.google_review_url; }, 2500);
    }
  };

  if (notFound) return <div className="login-page"><div className="login-card">This review link is not valid.</div></div>;
  if (!info) return <div className="login-page"><div className="login-card">Loading…</div></div>;

  if (done || info.already_reviewed) {
    const positive = (done?.rating ?? info.rating) >= 4;
    return (
      <div className="login-page">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <CheckCircle size={48} color="#22c55e" style={{ margin: '0 auto 12px' }} />
          <h2>Thank you!</h2>
          <p className="muted">
            {done?.google_review_url
              ? 'Taking you to Google to share your review…'
              : positive
                ? 'We appreciate your feedback so much.'
                : 'Thanks for the honest feedback — we’ll use it to do better.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card" style={{ textAlign: 'center', width: 440 }}>
        <div className="logo" style={{ justifyContent: 'center' }}><Truck size={26} color="#2563eb" /> {info.company_name}</div>
        <p className="muted" style={{ marginTop: 4 }}>
          {info.first_name ? `Hi ${info.first_name}! ` : ''}How was your moving experience?
        </p>
        <div className="row" style={{ justifyContent: 'center', gap: 6, margin: '18px 0' }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              size={40}
              style={{ cursor: 'pointer' }}
              fill={(hover || rating) >= n ? '#f59e0b' : 'none'}
              color={(hover || rating) >= n ? '#f59e0b' : '#cbd5e1'}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
            />
          ))}
        </div>
        {rating > 0 && (
          <>
            <textarea rows={3} placeholder={rating >= 4 ? 'What did you love? (optional)' : 'What could we have done better?'}
              value={comment} onChange={(e) => setComment(e.target.value)} />
            <button className="btn primary" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={submit} disabled={busy}>
              {busy ? 'Submitting…' : 'Submit review'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
