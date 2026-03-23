
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { UserData } from '../../types';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPrize: 0,
    activeMatches: 0
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  useEffect(() => {
    const usersRef = db.ref('users');
    const tourRef = db.ref('tournaments');

    const handleUsers = (s: any) => {
      const data = s.val() || {};
      const userList = Object.keys(data).map(key => ({ 
        ...data[key], 
        uid: key,
        wallet_deposit: data[key].wallet_deposit || 0,
        wallet_winnings: data[key].wallet_winnings || 0
      }));
      setUsers(userList);
      setStats(prev => ({ ...prev, totalUsers: userList.length }));
    };

    const handleTours = (s: any) => {
      const data = s.val() || {};
      const list = Object.values(data) as any[];
      setStats(prev => ({
        ...prev,
        activeMatches: list.filter(t => t.status !== 'Completed').length,
        totalPrize: list.filter(t => t.status === 'Completed').reduce((acc, curr) => acc + (curr.prizePool || 0), 0)
      }));
    };

    usersRef.on('value', handleUsers);
    tourRef.on('value', handleTours);

    return () => {
      usersRef.off('value', handleUsers);
      tourRef.off('value', handleTours);
    };
  }, []);

  const banUser = async (uid: string, currentBan: boolean) => {
    if (currentBan) {
      await db.ref(`users/${uid}`).update({ banUntil: null, banReason: null });
    } else {
      const reason = window.prompt("Reason for ban:");
      if (!reason) return;
      await db.ref(`users/${uid}`).update({ 
        banUntil: Date.now() + (24 * 3600 * 1000 * 365), // 1 year
        banReason: reason 
      });
    }
  };

  const updateBalance = async (uid: string, type: 'wallet_deposit' | 'wallet_winnings') => {
    const amount = window.prompt(`Enter amount to add/subtract (e.g. 100 or -100) for ${type}:`);
    if (!amount) return;
    const val = parseFloat(amount);
    if (isNaN(val)) return alert("Invalid number");

    const userRef = db.ref(`users/${uid}`);
    const snapshot = await userRef.once('value');
    const current = snapshot.val()[type] || 0;
    await userRef.update({ [type]: current + val });
    
    // Log transaction
    const txRef = db.ref(`users/${uid}/transactions`).push();
    await txRef.set({
      amount: Math.abs(val),
      type: val >= 0 ? 'credit' : 'debit',
      description: `Admin Adjustment (${type})`,
      timestamp: Date.now()
    });
    alert("Balance updated!");
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.appId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border shadow-sm">
          <p className="text-3xl font-black text-blue-600">{stats.totalUsers}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Players</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border shadow-sm">
          <p className="text-3xl font-black text-green-600">₹{stats.totalPrize}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Prize Paid</p>
        </div>
        <a 
          href="/admin.html" 
          target="_blank" 
          className="bg-slate-900 p-6 rounded-3xl border shadow-xl flex flex-col justify-center items-center text-center hover:bg-black transition-all group"
        >
          <i className="fas fa-shield-halved text-2xl text-indigo-400 mb-2 group-hover:scale-110 transition-transform"></i>
          <p className="text-xs font-black text-white uppercase tracking-tighter">Advanced Authority Panel</p>
          <p className="text-[8px] font-bold text-white/40 uppercase mt-1 tracking-widest">Full CRUD Control</p>
        </a>
      </div>

      <div className="bg-white rounded-[2.5rem] p-6 border shadow-sm">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black uppercase tracking-tighter">Registered Users</h3>
            <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded uppercase">Real-time Feed</span>
          </div>
          <div className="relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
            <input 
              type="text" 
              placeholder="Search by Username, App ID or Email..." 
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 hide-scrollbar">
          {filteredUsers.map(u => (
            <div key={u.uid} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[11px] font-black text-gray-900 uppercase">{u.username}</p>
                    <span className="text-[8px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded tracking-widest">{u.appId}</span>
                  </div>
                  <p className="text-[8px] text-gray-400 font-bold uppercase">{u.email}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => banUser(u.uid, !!u.banUntil)} className={`text-[8px] font-black px-3 py-1.5 rounded-xl uppercase ${u.banUntil ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {u.banUntil ? 'Unban' : 'Ban'}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => updateBalance(u.uid, 'wallet_deposit')}
                  className="bg-white border border-gray-200 p-2 rounded-xl text-left hover:bg-gray-100 transition-colors"
                >
                  <p className="text-[7px] font-black text-gray-400 uppercase">Deposit Bal</p>
                  <p className="text-[10px] font-black text-blue-700">₹{u.wallet_deposit?.toFixed(2)}</p>
                </button>
                <button 
                  onClick={() => updateBalance(u.uid, 'wallet_winnings')}
                  className="bg-white border border-gray-200 p-2 rounded-xl text-left hover:bg-gray-100 transition-colors"
                >
                  <p className="text-[7px] font-black text-gray-400 uppercase">Winning Bal</p>
                  <p className="text-[10px] font-black text-green-700">₹{u.wallet_winnings?.toFixed(2)}</p>
                </button>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && <p className="text-center text-gray-400 py-10 text-xs uppercase font-black">No matching users found</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
