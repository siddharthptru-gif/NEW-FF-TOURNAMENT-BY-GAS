
import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
// Fix: Removed modular signOut import
import { auth } from '../firebase';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    // Fix: Use auth instance signOut method
    await auth.signOut();
    navigate('/login');
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col pb-20 relative">
      <header className="sticky top-0 z-50 bg-gray-900 text-white px-4 py-4 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-lg font-bold">ADMIN PANEL</h1>
          <p className="text-xs text-gray-400">Manage Tournaments & Funds</p>
        </div>
        <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-white">
          <i className="fas fa-sign-out-alt"></i>
        </button>
      </header>

      <main className="flex-1 p-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t flex justify-around items-center py-1 z-50 shadow-up overflow-x-auto no-scrollbar">
        <NavLink 
          to="/admin/dashboard" 
          className={({ isActive }) => `flex flex-col items-center p-2 min-w-[60px] rounded-lg transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}
        >
          <i className="fas fa-tachometer-alt text-base"></i>
          <span className="text-[10px] font-bold mt-0.5">Stats</span>
        </NavLink>
        <NavLink 
          to="/admin/tournaments" 
          className={({ isActive }) => `flex flex-col items-center p-2 min-w-[60px] rounded-lg transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}
        >
          <i className="fas fa-trophy text-base"></i>
          <span className="text-[10px] font-bold mt-0.5">Match</span>
        </NavLink>
        <NavLink 
          to="/admin/match-images" 
          className={({ isActive }) => `flex flex-col items-center p-2 min-w-[60px] rounded-lg transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}
        >
          <i className="fas fa-image text-base"></i>
          <span className="text-[10px] font-bold mt-0.5">Images</span>
        </NavLink>
        <NavLink 
          to="/admin/requests" 
          className={({ isActive }) => `flex flex-col items-center p-2 min-w-[60px] rounded-lg transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}
        >
          <i className="fas fa-wallet text-base"></i>
          <span className="text-[10px] font-bold mt-0.5">Funds</span>
        </NavLink>
        <NavLink 
          to="/admin/tickets" 
          className={({ isActive }) => `flex flex-col items-center p-2 min-w-[60px] rounded-lg transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}
        >
          <i className="fas fa-headset text-base"></i>
          <span className="text-[10px] font-bold mt-0.5">Help</span>
        </NavLink>
        <NavLink 
          to="/admin/leaderboard" 
          className={({ isActive }) => `flex flex-col items-center p-2 min-w-[60px] rounded-lg transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}
        >
          <i className="fas fa-medal text-base"></i>
          <span className="text-[10px] font-bold mt-0.5">Board</span>
        </NavLink>
        <NavLink 
          to="/admin/logs" 
          className={({ isActive }) => `flex flex-col items-center p-2 min-w-[60px] rounded-lg transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}
        >
          <i className="fas fa-history text-base"></i>
          <span className="text-[10px] font-bold mt-0.5">Logs</span>
        </NavLink>
        <NavLink 
          to="/admin/reports" 
          className={({ isActive }) => `flex flex-col items-center p-2 min-w-[60px] rounded-lg transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}
        >
          <i className="fas fa-shield-alt text-base"></i>
          <span className="text-[10px] font-bold mt-0.5">Reports</span>
        </NavLink>
        <NavLink 
          to="/admin/settings" 
          className={({ isActive }) => `flex flex-col items-center p-2 min-w-[60px] rounded-lg transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}
        >
          <i className="fas fa-cog text-base"></i>
          <span className="text-[10px] font-bold mt-0.5">Setup</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default AdminLayout;
