import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Truck } from 'lucide-react';

// Horizontal carousel of Movers CRM screens. The screens are built in markup
// rather than bitmap screenshots so they stay sharp on every display, load with
// no extra requests, and adapt to light and dark rendering.

const NAV = ['Dashboard', 'Pipeline', 'Jobs', 'Dispatch', 'Invoices', 'Reports'];

function Frame({ active, title, caption, children }) {
  return (
    <figure className="dc-slide">
      <div className="dc-window">
        <div className="dc-bar"><span /><span /><span /><div className="dc-url">moverscrm.org/{active.toLowerCase()}</div></div>
        <div className="dc-body">
          <aside className="dc-side">
            <div className="dc-logo"><Truck size={14} /> Movers CRM</div>
            {NAV.map((n) => (
              <div key={n} className={'dc-navitem' + (n === active ? ' on' : '')}>{n}</div>
            ))}
          </aside>
          <div className="dc-main">{children}</div>
        </div>
      </div>
      <figcaption className="dc-caption"><strong>{title}</strong> {caption}</figcaption>
    </figure>
  );
}

const KPIS = [
  ['New leads', '38', '#6366f1'],
  ['Booked', '21', '#22c55e'],
  ['Cash collected', '$47.2k', '#0ea5e9'],
  ['Conversion', '55%', '#f59e0b'],
];

const COLUMNS = [
  ['Lead', 4, '#6366f1'],
  ['Opportunity', 3, '#0ea5e9'],
  ['Booked', 3, '#22c55e'],
  ['In Progress', 2, '#f59e0b'],
];

const CREWS = [
  ['8:00 AM', 'Nguyen, 3 bed house', 'Marcus, Tyrone, Sam', 'Truck 2'],
  ['9:30 AM', 'Cooper, office move', 'Priya, Diego', 'Truck 3'],
  ['11:00 AM', 'Garcia, 4 bed house', 'Kevin, Sam', 'Truck 1'],
  ['1:00 PM', 'Rodriguez, 2 bed apt', 'Marcus, Tyrone', 'Truck 2'],
];

const INVOICES = [
  ['INV-1042', 'Ava Thompson', '$1,284.00', 'Paid'],
  ['INV-1041', 'Liam Patel', '$3,910.50', 'Paid'],
  ['INV-1040', 'Noah Kim', '$2,145.00', 'Partial'],
  ['INV-1039', 'Emma Rodriguez', '$1,660.00', 'Sent'],
];

const BARS = [
  ['Google Ads', 78], ['Referral', 64], ['Website form', 52], ['Yelp', 34], ['Repeat', 22],
];

export default function DashboardCarousel() {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const count = 5;

  const scrollTo = (i) => {
    const next = Math.max(0, Math.min(count - 1, i));
    setIndex(next);
    const track = trackRef.current;
    if (!track) return;
    const slide = track.children[next];
    if (slide) track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: 'smooth' });
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const mid = track.scrollLeft + track.clientWidth / 2;
    let closest = 0;
    Array.from(track.children).forEach((c, i) => {
      const center = c.offsetLeft - track.offsetLeft + c.clientWidth / 2;
      if (Math.abs(center - mid) < Math.abs((track.children[closest].offsetLeft - track.offsetLeft + track.children[closest].clientWidth / 2) - mid)) closest = i;
    });
    if (closest !== index) setIndex(closest);
  };

  return (
    <section id="product" className="dc-section">
      <div className="lp-container">
        <div className="lp-section-head">
          <span className="lp-eyebrow">Inside the product</span>
          <h2>Watch your moving business come to life</h2>
          <p>From first call to final invoice, every screen your team needs in one place.</p>
        </div>

        <div className="dc-wrap">
          <button className="dc-arrow left" onClick={() => scrollTo(index - 1)} disabled={index === 0} aria-label="Previous screen">
            <ChevronLeft size={20} />
          </button>

          <div className="dc-track" ref={trackRef} onScroll={onScroll}>
            <Frame active="Dashboard" title="Dashboard." caption="Bookings, cash collected and conversion the moment you log in.">
              <div className="dc-kpis">
                {KPIS.map(([l, v, c]) => (
                  <div key={l} className="dc-kpi" style={{ borderTopColor: c }}>
                    <span>{l}</span><strong>{v}</strong>
                  </div>
                ))}
              </div>
              <div className="dc-chart">
                {[38, 52, 44, 68, 59, 76, 64].map((h, i) => (
                  <div key={i} className="dc-bar" style={{ height: `${h}%` }} />
                ))}
              </div>
            </Frame>

            <Frame active="Pipeline" title="Sales pipeline." caption="Drag leads from first call to booked so none go cold.">
              <div className="dc-board">
                {COLUMNS.map(([name, n, c]) => (
                  <div key={name} className="dc-col">
                    <div className="dc-coltitle"><i style={{ background: c }} /> {name} <b>{n}</b></div>
                    {Array.from({ length: n > 3 ? 3 : n }).map((_, i) => (
                      <div key={i} className="dc-card" style={{ borderLeftColor: c }}>
                        <span className="dc-line w70" /><span className="dc-line w45 dim" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </Frame>

            <Frame active="Dispatch" title="Dispatch board." caption="Crews and trucks assigned with live availability.">
              <div className="dc-rows">
                {CREWS.map(([time, job, crew, truck]) => (
                  <div key={time} className="dc-row">
                    <span className="dc-time">{time}</span>
                    <span className="dc-job">{job}</span>
                    <span className="dc-crew">{crew}</span>
                    <span className="dc-truck">{truck}</span>
                  </div>
                ))}
              </div>
            </Frame>

            <Frame active="Invoices" title="Billing." caption="Invoices from estimates, payments and balances tracked.">
              <div className="dc-rows">
                <div className="dc-row head"><span>Invoice</span><span>Customer</span><span>Total</span><span>Status</span></div>
                {INVOICES.map(([num, who, amt, st]) => (
                  <div key={num} className="dc-row">
                    <span className="dc-time">{num}</span>
                    <span className="dc-job">{who}</span>
                    <span className="dc-crew">{amt}</span>
                    <span className={'dc-pill ' + st.toLowerCase()}>{st}</span>
                  </div>
                ))}
              </div>
            </Frame>

            <Frame active="Reports" title="Reporting." caption="Lead source ROI so you know what actually books moves.">
              <div className="dc-report">
                {BARS.map(([label, w]) => (
                  <div key={label} className="dc-reportrow">
                    <span>{label}</span>
                    <div className="dc-trackbar"><div style={{ width: `${w}%` }} /></div>
                  </div>
                ))}
              </div>
            </Frame>
          </div>

          <button className="dc-arrow right" onClick={() => scrollTo(index + 1)} disabled={index === count - 1} aria-label="Next screen">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="dc-dots">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              className={'dc-dot' + (i === index ? ' on' : '')}
              onClick={() => scrollTo(i)}
              aria-label={`Go to screen ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
