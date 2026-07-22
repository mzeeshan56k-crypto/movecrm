import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Kanban, Truck, CalendarDays, Users, FileText,
  ClipboardList, BarChart3, Settings, LogOut, Boxes, Phone, Star, CreditCard,
} from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/pipeline', label: 'Sales Pipeline', icon: Kanban },
  { to: '/jobs', label: 'Jobs', icon: Boxes },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/dispatch', label: 'Dispatch', icon: Truck },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/calls', label: 'Calls', icon: Phone },
  { to: '/reviews', label: 'Reviews', icon: Star },
  { to: '/invoices', label: 'Invoicing', icon: FileText },
  { to: '/tasks', label: 'Tasks', icon: ClipboardList },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/billing', label: 'Plans & Billing', icon: CreditCard },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const PLAN_LABELS = { owner: 'Owner · Free', trial: 'Free trial', starter: 'Starter', growth: 'Growth', pro: 'Pro', enterprise: 'Enterprise' };

function planSub(org) {
  if (org.plan === 'trial' && org.trial_ends_at) {
    const days = Math.max(0, Math.ceil((new Date(org.trial_ends_at) - Date.now()) / 864e5));
    return days > 0 ? `Trial · ${days}d left` : 'Trial ended';
  }
  return PLAN_LABELS[org.plan] || org.plan;
}

export default function Layout() {
  const { user, organization, logout } = useAuth();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><Truck size={22} /> Movers CRM</div>
        {organization && (
          <div style={{ padding: '8px 18px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{organization.name}</div>
            <div style={{ color: organization.plan === 'owner' ? '#fbbf24' : 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600 }}>
              {planSub(organization)}
            </div>
          </div>
        )}
        <nav>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}>
              <Icon size={17} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="user-box">
          <div>
            <div className="name">{user?.name}</div>
            <div className="role">{user?.role}</div>
          </div>
          <button onClick={logout} title="Sign out"><LogOut size={16} /></button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
