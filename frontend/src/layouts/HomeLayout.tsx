import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

export const HomeLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-200">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default HomeLayout;
