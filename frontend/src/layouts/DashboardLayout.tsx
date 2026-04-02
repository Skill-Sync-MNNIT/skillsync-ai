import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

export const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 pb-20">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
