import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

export const HomeLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default HomeLayout;
