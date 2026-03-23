
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { UserData } from '../../types';

const AdminLeaderboard: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = db.ref('users');
    const handleValue = (s: any) => {
      const data = s.val() || {};
      const list = Object.keys(data).map(key => ({ ...data[key], uid: key }))
        .sort((a, b) => (b.totalWins || 0) - (a.totalWins || 0));
      setUsers(list);
      setLoading(false);
    };
    usersRef.on('value', handleValue);
    return () => usersRef.off('value', handleValue);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex justify-between items-center">
        <h2 className="text-xl font-black uppercase tracking-tighter">Leaderboard</h2>
        <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded uppercase">Top Players</span>
      </div>

      <div className="bg-white rounded-[2.5rem] p-6 border shadow-sm">
        <div className="space-y-4">
          {users.slice(0, 50).map((u, i) => (
            <div key={u.uid} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-4">
                <span className={`text-lg font-black ${i < 3 ? 'text-blue-600' : 'text-gray-400'}`}>#{i + 1}</span>
                <div>
                  <p className="text-[11px] font-black text-gray-900 uppercase">{u.username}</p>
                  <p className="text-[8px] text-gray-400 font-bold uppercase">App ID: {u.appId}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-blue-700">{u.totalWins || 0}</p>
                <p className="text-[8px] font-bold text-gray-400 uppercase">Wins</p>
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
