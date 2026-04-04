import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Player } from '@lottiefiles/react-lottie-player';
import PrivateRoute from './components/PrivateRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Verify } from './pages/Verify';
import { ForgotPassword } from './pages/ForgotPassword';
import { HomeLayout } from './layouts/HomeLayout';
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
    <div className="w-full max-w-sm mb-4 mix-blend-multiply dark:mix-blend-screen opacity-90">
      <Player
        autoplay
        loop
        src="https://assets3.lottiefiles.com/packages/lf20_suhe7qtm.json"
        style={{ height: '250px', width: '100%' }}
      />
    </div>
    <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Page Not Found</h2>
    <p className="mt-2 text-slate-500">The page you are looking for doesn't exist or has been moved.</p>
    <a href="/" className="mt-8 font-medium text-primary-600 hover:text-primary-500 transition-colors">Return to Home</a>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen font-sans bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-50 transition-colors duration-200">
        <Routes>
          {/* Public: AI Search Home Page */}
          <Route element={<HomeLayout />}>
            <Route path="/" element={<Search />} />
          </Route>

          {/* Auth Routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/verify-otp" element={<Verify />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />

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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
