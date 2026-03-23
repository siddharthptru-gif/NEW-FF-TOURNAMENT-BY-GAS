
import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
// Fix: Removed modular database imports
import { auth, db } from '../firebase';
import { UserData } from '../types';

const UserLayout: React.FC = () => {
  const [userData, setUserData] = React.useState<UserData | null>(null);
  const location = useLocation();

  React.useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      // Fix: Use db.ref and ref.on for listener
      const userRef = db.ref(`users/${user.uid}`);
      const handleValue = (snapshot: any) => {
        setUserData(snapshot.val());
      };
      userRef.on('value', handleValue);
      return () => userRef.off('value', handleValue);
    }
  }, []);

  const getTitle = () => {
    const path = location.pathname;
    if (path.includes('/home') || path === '/') return 'ESPORTS ARENA';
    if (path.includes('/matches')) return 'MY MATCHES';
    if (path.includes('/wallet')) return 'MY WALLET';
    if (path.includes('/profile')) return 'PROFILE';
    return 'ESPORTS ARENA';
  };

  // Calculate total balance from deposit and winnings
  const totalBalance = (userData?.wallet_deposit || 0) + (userData?.wallet_winnings || 0);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col pb-20 relative">
      <header className="sticky top-0 z-50 bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent uppercase">
          {getTitle()}
        </h1>
        <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
          <i className="fas fa-coins text-yellow-500 mr-2"></i>
          {/* Fix: Property 'wallet' does not exist on type 'UserData'. Calculating total balance from wallet_deposit and wallet_winnings. */}
          <span className="font-bold text-blue-700">₹{totalBalance.toFixed(2)}</span>
        </div>
      </header>

      <main className="flex-1 p-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t flex justify-around items-center py-2 z-50">
        <NavLink 
          to="/home" 
          className={({ isActive }) => `flex flex-col items-center p-2 rounded-lg transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <i className="fas fa-home text-lg"></i>
          <span className="text-xs font-medium mt-1">Home</span>
        </NavLink>
        <NavLink 
          to="/matches" 
          className={({ isActive }) => `flex flex-col items-center p-2 rounded-lg transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <i className="fas fa-gamepad text-lg"></i>
          <span className="text-xs font-medium mt-1">Matches</span>
        </NavLink>
        <NavLink 
          to="/wallet" 
          className={({ isActive }) => `flex flex-col items-center p-2 rounded-lg transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <i className="fas fa-wallet text-lg"></i>
          <span className="text-xs font-medium mt-1">Wallet</span>
        </NavLink>
        <NavLink 
          to="/profile" 
          className={({ isActive }) => `flex flex-col items-center p-2 rounded-lg transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <i className="fas fa-user text-lg"></i>
          <span className="text-xs font-medium mt-1">Profile</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default UserLayout;
