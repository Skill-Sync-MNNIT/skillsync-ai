import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { AppSidebar } from '../components/AppSidebar';
import { cn } from '../components/ui/Button';

export const DashboardLayout = () => {
  const location = useLocation();
  const isMessagesPage = location.pathname === '/messages';

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-200">
      <Navbar />
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 min-w-0">
          <div className={cn(
            "mx-auto transition-all duration-300",
            isMessagesPage
              ? "max-w-none px-0 py-0"
              : "max-w-[1200px] px-6 py-8 lg:px-8 pb-20"
          )}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
