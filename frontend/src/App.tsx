import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Verify } from './pages/Verify';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { MyProfile } from './pages/MyProfile';
import { ViewProfile } from './pages/ViewProfile';
import { Search } from './pages/Search';
import { JobListing } from './pages/JobListing';
import { JobCreate } from './pages/JobCreate';
import { JobDetail } from './pages/JobDetail';
import { Notifications } from './pages/Notifications';
import { Settings } from './pages/Settings';

const NotFound = () => (
  <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
    <h1 className="text-8xl font-black text-slate-200">404</h1>
    <h2 className="mt-4 text-2xl font-bold text-slate-900">Page Not Found</h2>
    <p className="mt-2 text-slate-500">The page you are looking for doesn't exist or has been moved.</p>
    <a href="/dashboard" className="mt-8 font-medium text-primary-600 hover:text-primary-500 transition-colors">Return to Dashboard</a>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen font-sans bg-slate-50 text-slate-900">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/auth/login" replace />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/verify-otp" element={<Verify />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<MyProfile />} />
              <Route path="/profile/:userId" element={<ViewProfile />} />
              <Route path="/search" element={<Search />} />
              <Route path="/jobs" element={<JobListing />} />
              <Route path="/jobs/create" element={<JobCreate />} />
              <Route path="/jobs/:jobId" element={<JobDetail />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
