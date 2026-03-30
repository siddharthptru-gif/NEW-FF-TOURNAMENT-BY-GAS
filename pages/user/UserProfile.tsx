
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { UserData } from '../../types';

const UserProfile: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const userRef = db.ref(`users/${user.uid}`);
      const handleValue = (snapshot: any) => {
        setUserData(snapshot.val());
      };
      userRef.on('value', handleValue);
      return () => userRef.off('value', handleValue);
    }
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
  };

  const handleReset = async () => {
    if (auth.currentUser?.email) {
      await auth.sendPasswordResetEmail(auth.currentUser.email);
      alert("Password reset link sent to your email.");
    }
  };

  const matches = userData?.matchesPlayed || 0;
  const wins = userData?.totalWins || 0;
  const kills = userData?.totalKills || 0;
  
  const winRate = matches > 0 ? ((wins / matches) * 100).toFixed(1) : "0.0";
  const avgKills = matches > 0 ? (kills / matches).toFixed(1) : "0.0";

  return (
    <div className="space-y-6 pb-6">
      {/* Header Profile Info */}
      <div className="flex flex-col items-center py-6 text-center">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-teal-400 p-1 shadow-xl">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
               <i className="fas fa-user-ninja text-4xl text-blue-600"></i>
            </div>
          </div>
        </div>
        <h2 className="text-2xl font-black text-gray-900">{userData?.username || 'Gamer'}</h2>
        <p className="text-xs text-gray-500 font-medium">{userData?.email}</p>
        <div className="mt-3 flex items-center gap-2 bg-blue-50 px-4 py-1.5 rounded-2xl border border-blue-100">
           <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Player ID:</span>
           <span className="text-sm font-black text-blue-700 select-all tracking-widest">{userData?.appId || '------'}</span>
        </div>
      </div>

      {/* Analytical Statistics Grid */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black uppercase tracking-tighter text-gray-800">Combat Analytics</h3>
          <i className="fas fa-chart-line text-blue-500 opacity-20"></i>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <i className="fas fa-trophy text-sm"></i>
            </div>
            <p className="text-lg font-black text-gray-800">{winRate}%</p>
            <p className="text-[8px] font-black uppercase text-gray-400">Win Rate</p>
          </div>
          
          <div className="text-center">
            <div className="w-10 h-10 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <i className="fas fa-crosshairs text-sm"></i>
            </div>
            <p className="text-lg font-black text-gray-800">{avgKills}</p>
            <p className="text-[8px] font-black uppercase text-gray-400">Kills/Match</p>
          </div>
          
          <div className="text-center">
            <div className="w-10 h-10 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <i className="fas fa-shield-alt text-sm"></i>
            </div>
            <p className="text-lg font-black text-gray-800">{matches}</p>
            <p className="text-[8px] font-black uppercase text-gray-400">Total Play</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-50 flex justify-around">
           <div className="text-center">
              <p className="text-xs font-black text-gray-700">{wins}</p>
              <p className="text-[7px] font-black text-gray-400 uppercase">Booyahs</p>
           </div>
           <div className="text-center">
              <p className="text-xs font-black text-gray-700">{kills}</p>
              <p className="text-[7px] font-black text-gray-400 uppercase">Eliminations</p>
           </div>
        </div>
      </div>

      {/* Action Menu */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <button onClick={() => navigate('/support')} className="w-full p-5 border-b border-gray-50 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mr-4">
              <i className="fas fa-headset text-xs"></i>
            </div>
            <span className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Support & Help</span>
          </div>
          <div className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Online</div>
        </button>

        <button onClick={handleReset} className="w-full p-5 border-b border-gray-50 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-100 text-gray-500 rounded-xl flex items-center justify-center mr-4">
              <i className="fas fa-key text-xs"></i>
            </div>
            <span className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Account Security</span>
          </div>
          <i className="fas fa-chevron-right text-gray-300 text-xs"></i>
        </button>

        <button onClick={handleLogout} className="w-full p-6 text-center text-red-600 font-black uppercase tracking-[0.2em] text-xs hover:bg-red-50 transition-colors">
          Logout Session
        </button>
      </div>
      
      <p className="text-center text-[10px] text-gray-300 font-bold uppercase tracking-widest">Arena Pro v1.2.5 Stable Build</p>
    </div>
  );
};

export default UserProfile;
