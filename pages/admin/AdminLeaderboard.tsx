
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { UserData } from '../../types';
import { Medal, Edit2, Trophy } from 'lucide-react';

const AdminLeaderboard: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = db.ref('users').orderByChild('totalWins').limitToLast(50);
    const handleValue = (s: any) => {
      const list: UserData[] = [];
      s.forEach((child: any) => {
        list.push({ ...child.val(), uid: child.key });
      });
      // Firebase limitToLast returns in ascending order, so we reverse it
      setUsers(list.reverse());
      setLoading(false);
    };
    usersRef.on('value', handleValue);
    return () => usersRef.off('value', handleValue);
  }, []);

  const updateWins = async (uid: string) => {
    const amount = window.prompt("Enter new total wins:");
    if (amount === null) return;
    const val = parseInt(amount);
    if (isNaN(val)) return alert("Invalid number");

    await db.ref(`users/${uid}`).update({ totalWins: val });
    alert("Wins updated!");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Medal className="text-indigo-600" size={20} />
          <h2 className="text-xl font-black uppercase tracking-tighter">Leaderboard</h2>
        </div>
        <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded uppercase">Top Players</span>
      </div>

      <div className="bg-white rounded-[2.5rem] p-6 border shadow-sm">
        <div className="space-y-4">
          {users.map((u, i) => (
            <div key={u.uid} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:border-indigo-100 transition-colors">
              <div className="flex items-center gap-4">
                <span className={`text-lg font-black min-w-[24px] ${i < 3 ? 'text-indigo-600' : 'text-gray-300'}`}>
                  {i === 0 ? <Trophy size={20} /> : `#${i + 1}`}
                </span>
                <div>
                  <p className="text-[11px] font-black text-gray-900 uppercase">{u.username}</p>
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">App ID: {u.appId}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-black text-indigo-700">{u.totalWins || 0}</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Wins</p>
                </div>
                <button 
                  onClick={() => updateWins(u.uid)}
                  className="p-2 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                >
                  <Edit2 size={12} />
                </button>
              </div>
            </div>
          ))}
          {users.length === 0 && !loading && (
            <p className="text-center text-gray-400 py-10 text-xs uppercase font-black">No players found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLeaderboard;
