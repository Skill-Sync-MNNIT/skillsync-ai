import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Player } from '@lottiefiles/react-lottie-player';
import PrivateRoute from './components/layout/PrivateRoute';
import { ToastProvider } from './context/ToastContext';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Verify = lazy(() => import('./pages/Verify').then(m => ({ default: m.Verify })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const HomeLayout = lazy(() => import('./layouts/HomeLayout').then(m => ({ default: m.HomeLayout })));
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const MyProfile = lazy(() => import('./pages/MyProfile').then(m => ({ default: m.MyProfile })));
const ViewProfile = lazy(() => import('./pages/ViewProfile').then(m => ({ default: m.ViewProfile })));
const Search = lazy(() => import('./pages/Search').then(m => ({ default: m.Search })));
const JobListing = lazy(() => import('./pages/JobListing').then(m => ({ default: m.JobListing })));
const JobCreate = lazy(() => import('./pages/JobCreate').then(m => ({ default: m.JobCreate })));
const JobDetail = lazy(() => import('./pages/JobDetail').then(m => ({ default: m.JobDetail })));
const JobEdit = lazy(() => import('./pages/JobEdit').then(m => ({ default: m.JobEdit })));
const Notifications = lazy(() => import('./pages/Notifications').then(m => ({ default: m.Notifications })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Networking = lazy(() => import('./pages/Networking').then(m => ({ default: m.Networking })));
const ConnectionRequests = lazy(() => import('./pages/ConnectionRequests').then(m => ({ default: m.ConnectionRequests })));
const Messages = lazy(() => import('./pages/Messages').then(m => ({ default: m.Messages })));
const ProjectBoard = lazy(() => import('./pages/ProjectBoard').then(m => ({ default: m.ProjectBoard })));


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
    <ToastProvider>
      <BrowserRouter>
        <div className="min-h-screen font-sans bg-slate-50/50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-200">
          <Suspense fallback={<LoadingSpinner fullPage message="Securely loading your workspace..." />}>
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
                  <Route path="/jobs/:jobId/edit" element={<JobEdit />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/networking" element={<Networking />} />
                  <Route path="/networking/requests" element={<ConnectionRequests />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/projects" element={<ProjectBoard />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
