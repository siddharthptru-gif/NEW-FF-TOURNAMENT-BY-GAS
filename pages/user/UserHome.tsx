
import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../firebase';
import { Tournament, UserData, GlobalChatMessage, PaymentProof } from '../../types';

const UserHome: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      db.ref(`users/${user.uid}`).on('value', s => setUserData(s.val()));
    }

    db.ref('settings/modes').on('value', s => {
      const modes = s.val() || {};
      const modeList = Object.keys(modes);
      setCategories(modeList);
      if (modeList.length > 0 && !activeCategory) {
        setActiveCategory(modeList[0]);
      }
    });

    db.ref('tournaments').on('value', s => {
      const data = s.val() || {};
      const tournamentList = Object.keys(data).map(key => ({ ...data[key], id: key })) as Tournament[];
      setTournaments(tournamentList);
    });

    return () => {
      db.ref(`users/${user?.uid}`).off();
      db.ref('settings/modes').off();
      db.ref('tournaments').off();
    };
  }, []);

  const getRank = (kills: number) => {
    if (kills > 250) return { name: 'Heroic', color: 'text-red-500' };
    if (kills > 100) return { name: 'Platinum', color: 'text-blue-400' };
    if (kills > 50) return { name: 'Gold', color: 'text-yellow-500' };
    if (kills > 10) return { name: 'Silver', color: 'text-gray-400' };
    return { name: 'Bronze', color: 'text-amber-600' };
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-3xl shadow-sm border text-center">
          <p className="text-xl font-black text-gray-800">{userData?.totalKills || 0}</p>
          <p className="text-[8px] font-black uppercase text-gray-400">Total Kills</p>
        </div>
        <div className="bg-indigo-900 p-4 rounded-3xl shadow-lg text-center border-b-4 border-indigo-700">
          <p className={`text-xs font-black uppercase ${getRank(userData?.totalKills || 0).color}`}>
            {getRank(userData?.totalKills || 0).name}
          </p>
          <p className="text-[8px] font-black uppercase text-white/40">Your Rank</p>
        </div>
        <div className="bg-white p-4 rounded-3xl shadow-sm border text-center">
          <p className="text-xl font-black text-gray-800">{userData?.matchesPlayed || 0}</p>
          <p className="text-[8px] font-black uppercase text-gray-400">Matches</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)} 
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeCategory === cat ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-400 border shadow-sm'}`}
          >
            {cat.replace(' TOURNAMENT', '')}
          </button>
        ))}
        {categories.length === 0 && (
          ['1ST BATTLE ROYALE TOURNAMENT', '2ND CLASH SQUAD TOURNAMENT', '3RD LONE WOLF TOURNAMENT', '4TH FREE PRACTICE TOURNAMENT'].map(cat => (
            <button 
              key={cat}
              className="whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-white text-gray-400 border shadow-sm opacity-50"
            >
              {cat.replace(' TOURNAMENT', '')}
            </button>
          ))
        )}
      </div>

      <div className="animate-in fade-in duration-300">
        <div className="space-y-4">
          {tournaments.filter(t => t.category === activeCategory).map(t => {
            const isRegistered = t.participants && auth.currentUser && t.participants[auth.currentUser.uid];
            return (
              <div key={t.id} className="bg-white rounded-[2rem] overflow-hidden border shadow-sm">
                <img src={t.thumbnail || `https://picsum.photos/seed/${t.id}/400/180`} className="w-full h-32 object-cover" />
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-black text-gray-900 uppercase tracking-tighter">{t.title}</h4>
                    <span className="bg-blue-50 text-blue-600 text-[8px] font-black px-2 py-0.5 rounded uppercase">{t.status}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="bg-gray-50 p-2 rounded-xl"><p className="text-[7px] text-gray-400 font-black uppercase">Fee</p><p className="text-xs font-black">₹{t.entryFee}</p></div>
                    <div className="bg-green-50 p-2 rounded-xl"><p className="text-[7px] text-green-400 font-black uppercase">Prize</p><p className="text-xs font-black text-green-600">₹{t.prizePool}</p></div>
                    <div className="bg-indigo-50 p-2 rounded-xl"><p className="text-[7px] text-indigo-400 font-black uppercase">Kill</p><p className="text-xs font-black text-indigo-600">₹{t.perKillPrize || 0}</p></div>
                  </div>
                  {t.status === 'Completed' ? (
                    <button onClick={() => setSelectedTournament(t)} className="w-full py-3 bg-indigo-600 text-white font-black rounded-xl text-[10px] uppercase shadow-lg shadow-indigo-100">VIEW RESULTS</button>
                  ) : (
                    <button disabled={!!isRegistered} className={`w-full py-3 font-black rounded-xl text-[10px] uppercase shadow-lg ${isRegistered ? 'bg-gray-100 text-gray-400 shadow-none' : 'bg-blue-600 text-white shadow-blue-100'}`}>
                      {isRegistered ? 'REGISTERED' : 'JOIN NOW'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {tournaments.filter(t => t.category === activeCategory).length === 0 && (
            <p className="text-center py-10 text-gray-400 font-black text-[10px] uppercase">No Tournaments Found</p>
          )}
        </div>
      </div>

      {/* Results Modal */}
      {selectedTournament && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[40px] p-8 relative max-h-[90vh] flex flex-col">
            <button onClick={() => setSelectedTournament(null)} className="absolute top-6 right-6 text-gray-300"><i className="fas fa-times"></i></button>
            <h4 className="font-black text-center uppercase mb-6 text-gray-900">{selectedTournament.title} Results</h4>
            <div className="space-y-2 overflow-y-auto hide-scrollbar flex-1">
              {selectedTournament.participants && Object.keys(selectedTournament.participants).length > 0 ? (
                Object.values(selectedTournament.participants).map((p: any, i) => (
                  <div key={i} className="bg-gray-50 p-3 rounded-2xl border flex justify-between items-center mb-2">
                    <div>
                      <p className="text-[10px] font-black text-gray-800 uppercase">{p.username}</p>
                      <p className="text-[7px] font-bold text-gray-400">IGN: {p.gameUsername}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[9px] font-black uppercase ${p.result === 'Winner' ? 'text-green-600' : p.result === 'Loser' ? 'text-red-500' : 'text-gray-500'}`}>
                        {p.result || 'Participant'}
                      </p>
                      {p.prize ? <p className="text-[8px] font-black text-indigo-600">Won ₹{p.prize}</p> : null}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-[10px] text-gray-400 font-bold uppercase">No participants found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserHome;
