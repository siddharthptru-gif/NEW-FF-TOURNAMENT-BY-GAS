
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Trophy, 
  Image as ImageIcon, 
  Wallet, 
  LifeBuoy, 
  Medal, 
  History, 
  Layers, 
  UserX, 
  ShieldAlert, 
  Settings, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/tournaments", icon: Trophy, label: "Tournaments" },
    { to: "/admin/match-images", icon: ImageIcon, label: "Match Images" },
    { to: "/admin/requests", icon: Wallet, label: "Fund Requests" },
    { to: "/admin/tickets", icon: LifeBuoy, label: "Support Tickets" },
    { to: "/admin/leaderboard", icon: Medal, label: "Leaderboard" },
    { to: "/admin/logs", icon: History, label: "Admin Logs" },
    { to: "/admin/bulk", icon: Layers, label: "Bulk Tools" },
    { to: "/admin/moderation", icon: UserX, label: "Moderation" },
    { to: "/admin/reports", icon: ShieldAlert, label: "Reports" },
    { to: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col relative overflow-x-hidden">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b flex justify-between items-center bg-gray-900 text-white">
                <div>
                  <h2 className="text-xl font-black tracking-tighter">ADMIN</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Control Panel</p>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsSidebarOpen(false)}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-tight transition-all
                      ${isActive 
                        ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                    `}
                  >
                    <item.icon size={18} strokeWidth={2.5} />
                    {item.label}
                  </NavLink>
                ))}
              </div>

              <div className="p-4 border-t bg-gray-50">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-50 bg-gray-900 text-white px-4 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tighter">ADMIN PANEL</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Esports Management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-black text-xs">
            AD
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 pb-24">
        <Outlet />
      </main>

      {/* Quick Access Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-md border-t flex justify-around items-center py-2 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <NavLink 
          to="/admin/dashboard" 
          className={({ isActive }) => `flex flex-col items-center p-2 min-w-[64px] rounded-xl transition-all ${isActive ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-400 hover:text-gray-600'}`}
        >
          {({ isActive }) => (
            <>
              <LayoutDashboard size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-black mt-1 uppercase">Stats</span>
            </>
          )}
        </NavLink>
        <NavLink 
          to="/admin/tournaments" 
          className={({ isActive }) => `flex flex-col items-center p-2 min-w-[64px] rounded-xl transition-all ${isActive ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-400 hover:text-gray-600'}`}
        >
          {({ isActive }) => (
            <>
              <Trophy size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-black mt-1 uppercase">Match</span>
            </>
          )}
        </NavLink>
        <NavLink 
          to="/admin/requests" 
          className={({ isActive }) => `flex flex-col items-center p-2 min-w-[64px] rounded-xl transition-all ${isActive ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-400 hover:text-gray-600'}`}
        >
          {({ isActive }) => (
            <>
              <Wallet size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-black mt-1 uppercase">Funds</span>
            </>
          )}
        </NavLink>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="flex flex-col items-center p-2 min-w-[64px] rounded-xl text-gray-400 hover:text-gray-600 transition-all"
        >
          <Menu size={20} />
          <span className="text-[9px] font-black mt-1 uppercase">More</span>
        </button>
      </nav>
    </div>
  );
};

export default AdminLayout;
