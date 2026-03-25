
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { UserData } from '../../types';

const AdminModeration: React.FC = () => {
  const [bannedUsers, setBannedUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [blacklistUid, setBlacklistUid] = useState('');

  useEffect(() => {
    const usersRef = db.ref('users');
    const handleValue = (snapshot: any) => {
      const data = snapshot.val() || {};
      const list = Object.keys(data)
        .map(key => ({ ...data[key], uid: key }))
        .filter(u => u.banUntil && u.banUntil > Date.now());
      setBannedUsers(list);
      setLoading(false);
    };
    usersRef.on('value', handleValue);
    return () => usersRef.off('value', handleValue);
  }, []);

  const unbanUser = async (uid: string) => {
    if (!window.confirm("Unban this user?")) return;
    await db.ref(`users/${uid}`).update({ banUntil: null, banReason: null });
    alert("User unbanned!");
  };

  const blacklistUser = async () => {
    if (!blacklistUid.trim()) return;
    const reason = window.prompt("Reason for blacklist:");
    if (!reason) return;
    
    setLoading(true);
    try {
      const userSnap = await db.ref(`users/${blacklistUid}`).once('value');
      if (!userSnap.exists()) {
        alert("User not found with this UID!");
        return;
      }
      await db.ref(`users/${blacklistUid}`).update({
        banUntil: Date.now() + (100 * 365 * 24 * 60 * 60 * 1000), // 100 years
        banReason: reason
      });
      setBlacklistUid('');
      alert("User blacklisted permanently!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[2rem] border shadow-sm">
        <h3 className="text-sm font-black uppercase mb-4 tracking-tighter text-gray-800">Blacklist User (UID)</h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Enter User UID..." 
            className="flex-1 p-4 bg-gray-50 border rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-500"
            value={blacklistUid}
            onChange={e => setBlacklistUid(e.target.value)}
          />
          <button 
            onClick={blacklistUser}
            disabled={loading}
            className="px-6 bg-red-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg disabled:opacity-50"
          >
            Blacklist
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border shadow-sm">
        <h3 className="text-sm font-black uppercase mb-4 tracking-tighter text-gray-800">Currently Banned Users</h3>
        <div className="space-y-4">
          {bannedUsers.map(u => (
            <div key={u.uid} className="bg-red-50 p-4 rounded-2xl border border-red-100 flex justify-between items-center">
              <div>
                <p className="text-[11px] font-black text-gray-900 uppercase">{u.username || 'Unknown'}</p>
                <p className="text-[8px] text-red-600 font-bold uppercase">Reason: {u.banReason || 'No reason'}</p>
                <p className="text-[7px] text-gray-400 font-bold uppercase">UID: {u.uid}</p>
              </div>
              <button 
                onClick={() => unbanUser(u.uid)}
                className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-xl text-[9px] font-black uppercase hover:bg-red-600 hover:text-white transition-all"
              >
                Unban
              </button>
            </div>
          ))}
          {bannedUsers.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-400 text-xs uppercase font-black">No users are currently banned</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminModeration;
