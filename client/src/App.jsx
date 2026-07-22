import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth.jsx';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import OwnerSetup from './pages/OwnerSetup.jsx';
import PublicQuote from './pages/PublicQuote.jsx';
import PublicReview from './pages/PublicReview.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Pipeline from './pages/Pipeline.jsx';
import Jobs from './pages/Jobs.jsx';
import JobDetail from './pages/JobDetail.jsx';
import Calendar from './pages/Calendar.jsx';
import Dispatch from './pages/Dispatch.jsx';
import Customers from './pages/Customers.jsx';
import CustomerDetail from './pages/CustomerDetail.jsx';
import Invoices from './pages/Invoices.jsx';
import Calls from './pages/Calls.jsx';
import Reviews from './pages/Reviews.jsx';
import Tasks from './pages/Tasks.jsx';
import Reports from './pages/Reports.jsx';
import Billing from './pages/Billing.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="empty">Loading…</div>;
  return (
    <Routes>
      {/* Public — no login required (customer-facing pages) */}
      <Route path="/quote/:publicKey" element={<PublicQuote />} />
      <Route path="/review/:token" element={<PublicReview />} />

      {!user ? (
        <>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/owner" element={<OwnerSetup />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/dispatch" element={<Dispatch />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/calls" element={<Calls />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      )}
    </Routes>
  );
}
