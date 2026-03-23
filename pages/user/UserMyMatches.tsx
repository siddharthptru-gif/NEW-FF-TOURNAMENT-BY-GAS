
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { Tournament } from '../../types';

const UserMyMatches: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Live' | 'Completed'>('Upcoming');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const tourRef = db.ref('tournaments');
    const handleValue = (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        setTournaments(Object.keys(data).map(key => ({ ...data[key], id: key })).filter(t => t.participants && t.participants[user.uid]));
      }
      setLoading(false);
    };
    tourRef.on('value', handleValue);
    return () => tourRef.off('value', handleValue);
  }, []);

  const copyAndPlay = (rid: string) => {
    navigator.clipboard.writeText(rid);
    alert("Room ID Copied! Launching Free Fire...");
    // Deep link to Free Fire (common intent)
    window.location.href = "intent:#Intent;package=com.dts.freefireth;end";
  };

  const submitResult = (tid: string) => {
    const proofUrl = window.prompt("Paste Screenshot URL (Imgur/Cloud):");
    if (!proofUrl) return;
    db.ref(`tournaments/${tid}/participants/${auth.currentUser?.uid}`).update({
      resultSubmitted: true,
      resultScreenshot: proofUrl
    });
    alert("Result submitted for admin verification!");
  };

  const filtered = tournaments.filter(t => t.status === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex bg-white rounded-2xl p-1 shadow-sm border">
        <button onClick={() => setActiveTab('Upcoming')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'Upcoming' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400'}`}>Upcoming</button>
        <button onClick={() => setActiveTab('Live')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'Live' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400'}`}>Live</button>
        <button onClick={() => setActiveTab('Completed')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'Completed' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-400'}`}>Results</button>
      </div>

      <div className="space-y-4">
        {filtered.map(t => (
          <div key={t.id} className="bg-white rounded-[2rem] p-5 border shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-black text-gray-900 uppercase">{t.title}</h4>
              <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${t.status === 'Live' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>{t.status}</span>
            </div>

            {t.status === 'Live' && (
              <div className="space-y-3 mb-4">
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-center">
                  <p className="text-[10px] font-black text-red-800 uppercase mb-1">Room ID</p>
                  <p className="text-xl font-black text-red-600 tracking-widest select-all">{t.roomId || 'PENDING'}</p>
                </div>
                <button onClick={() => copyAndPlay(t.roomId || '')} className="w-full py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-red-100 flex items-center justify-center gap-2">
                  <i className="fas fa-play"></i> Copy & Play
                </button>
              </div>
            )}

            <div className="flex justify-between items-center text-[10px] font-black border-t pt-4">
              <span className="text-gray-400 uppercase">{new Date(t.matchTime).toLocaleString()}</span>
              {t.status !== 'Completed' && (
                <button onClick={() => submitResult(t.id)} className="text-blue-600 uppercase underline">Submit Screenshot</button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-20 text-gray-400 font-black uppercase text-xs">No matches found</div>}
      </div>
    </div>
  );
};

export default UserMyMatches;
