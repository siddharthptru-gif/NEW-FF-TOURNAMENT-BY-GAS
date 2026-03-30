
import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../../firebase';
import { Tournament, UserData } from '../../types';

const AdminManageTournaments: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [viewPlayers, setViewPlayers] = useState<string | null>(null);
  const [editMatchId, setEditMatchId] = useState<string | null>(null);
  const [manageResultsId, setManageResultsId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    game: 'BATTLE ROYALE',
    entryFee: 0,
    prizePool: 0,
    perKillPrize: 0,
    matchTime: '',
    thumbnail: '',
  });

  const [editFormData, setEditFormData] = useState({
    title: '',
    game: '',
    entryFee: 0,
    prizePool: 0,
    perKillPrize: 0,
    matchTime: '',
    status: 'Upcoming' as any,
    imageUrl: '',
  });

  const logAdminAction = async (action: string, details: string) => {
    try {
      const logRef = db.ref('auditLogs').push();
      await logRef.set({
        adminId: 'admin', // Should ideally be from auth
        action,
        details,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error("Failed to log action:", err);
    }
  };

  const [gameModes, setGameModes] = useState<string[]>([]);

  useEffect(() => {
    const tourRef = db.ref('tournaments');
    const modesRef = db.ref('settings/modes');

    const handleValue = (snapshot: any) => {
      const data = snapshot.val() || {};
      setTournaments(Object.keys(data).map(key => ({ ...data[key], id: key })));
    };

    const handleModes = (snapshot: any) => {
      const data = snapshot.val() || {};
      setGameModes(Object.keys(data));
    };

    tourRef.on('value', handleValue);
    modesRef.on('value', handleModes);

    return () => {
      tourRef.off('value', handleValue);
      modesRef.off('value', handleModes);
    };
  }, []);

  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      let imageUrl = '';
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        try {
          const storageRef = storage.ref(`tournaments/${Date.now()}_${file.name}`);
          await storageRef.put(file);
          imageUrl = await storageRef.getDownloadURL();
        } catch (uploadError: any) {
          console.error("Image upload failed:", uploadError);
          alert("Image upload failed. Creating match without image. Error: " + uploadError.message);
        }
      }

      const newRef = db.ref('tournaments').push();
      await newRef.set({ 
        ...formData, 
        category: formData.game, // Ensure category is set
        imageUrl: imageUrl || formData.thumbnail,
        status: 'Upcoming', 
        participants: {}, 
        createdAt: Date.now() 
      });
      setShowForm(false);
      setFormData({ title: '', game: 'BATTLE ROYALE', entryFee: 0, prizePool: 0, perKillPrize: 0, matchTime: '', thumbnail: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error("Error creating tournament:", error);
      alert("Failed to create tournament. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const updateStatus = async (tid: string, status: string) => {
    if (status === 'Live') {
      const rid = window.prompt("Room ID:");
      const pass = window.prompt("Room Password:");
      if (!rid) return;
      await db.ref(`tournaments/${tid}`).update({ status, roomId: rid, roomPassword: pass });
    } else if (status === 'Completed') {
      const winnerId = window.prompt("Enter Winner's App ID:");
      if (!winnerId) return;

      const userQuery = await db.ref('users').orderByChild('appId').equalTo(winnerId).once('value');
      if (!userQuery.exists()) return alert("User not found!");
      const winnerUid = Object.keys(userQuery.val())[0];
      const winnerData = userQuery.val()[winnerUid];
      const tournament = tournaments.find(t => t.id === tid)!;

      // Handle payout logic
      const updates: any = {};
      updates[`users/${winnerUid}/wallet_winnings`] = (winnerData.wallet_winnings || 0) + tournament.prizePool;
      updates[`tournaments/${tid}/status`] = 'Completed';
      updates[`tournaments/${tid}/winnerUid`] = winnerUid;
      
      const txRef = db.ref(`users/${winnerUid}/transactions`).push();
      updates[`users/${winnerUid}/transactions/${txRef.key}`] = {
        amount: tournament.prizePool, type: 'credit', description: `Winner: ${tournament.title}`, timestamp: Date.now()
      };

      await db.ref().update(updates);
      alert("Payout Successful!");
    } else {
      await db.ref(`tournaments/${tid}`).update({ status });
    }
  };

  const openEditModal = (t: Tournament) => {
    setEditMatchId(t.id);
    setEditFormData({
      title: t.title,
      game: t.game || t.category,
      entryFee: t.entryFee,
      prizePool: t.prizePool,
      perKillPrize: t.perKillPrize || 0,
      matchTime: t.matchTime,
      status: t.status,
      imageUrl: t.imageUrl || t.thumbnail || '',
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMatchId) return;
    setIsUploading(true);
    try {
      let imageUrl = editFormData.imageUrl;
      const file = editFileInputRef.current?.files?.[0];
      if (file) {
        const storageRef = storage.ref(`tournaments/${Date.now()}_${file.name}`);
        await storageRef.put(file);
        imageUrl = await storageRef.getDownloadURL();
      }

      await db.ref(`tournaments/${editMatchId}`).update({
        ...editFormData,
        imageUrl,
        category: editFormData.game
      });
      setEditMatchId(null);
      logAdminAction('EDIT_MATCH', `Updated match ${editMatchId}`);
      alert("Match updated!");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const addComment = async () => {
    if (!manageResultsId || !commentText.trim()) return;
    try {
      await db.ref(`tournaments/${manageResultsId}/adminComments`).push({
        text: commentText,
        timestamp: Date.now()
      });
      setCommentText('');
      logAdminAction('ADD_COMMENT', `Added comment to match ${manageResultsId}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const kickPlayer = async (uid: string) => {
    if (!manageResultsId || !window.confirm("Kick this player?")) return;
    try {
      await db.ref(`tournaments/${manageResultsId}/participants/${uid}`).remove();
      logAdminAction('KICK_PLAYER', `Kicked user ${uid} from match ${manageResultsId}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const flagPlayer = async (uid: string, flagged: boolean) => {
    if (!manageResultsId) return;
    try {
      await db.ref(`tournaments/${manageResultsId}/participants/${uid}`).update({ flagged });
      logAdminAction('FLAG_PLAYER', `${flagged ? 'Flagged' : 'Unflagged'} user ${uid} in match ${manageResultsId}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const updateResult = async (uid: string, result: string) => {
    if (!manageResultsId) return;
    try {
      await db.ref(`tournaments/${manageResultsId}/participants/${uid}`).update({ result });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const savePrize = async (uid: string, kills: number, prize: number) => {
    if (!manageResultsId) return;
    try {
      const t = tournaments.find(x => x.id === manageResultsId);
      const p = t?.participants[uid];
      if (!p) return;

      const updates: any = {};
      updates[`tournaments/${manageResultsId}/participants/${uid}/kills`] = kills;
      updates[`tournaments/${manageResultsId}/participants/${uid}/prize`] = prize;
      updates[`tournaments/${manageResultsId}/participants/${uid}/statsProcessed`] = true;

      // Update user stats
      const userSnap = await db.ref(`users/${uid}`).once('value');
      const u = userSnap.val();
      if (u) {
        updates[`users/${uid}/totalKills`] = (u.totalKills || 0) + kills;
        updates[`users/${uid}/totalWins`] = (u.totalWins || 0) + (p.result === '1' ? 1 : 0);
        updates[`users/${uid}/matchesPlayed`] = (u.matchesPlayed || 0) + 1;
        
        if (prize > 0) {
          updates[`users/${uid}/wallet_winnings`] = (u.wallet_winnings || 0) + prize;
          const txRef = db.ref(`users/${uid}/transactions`).push();
          updates[`users/${uid}/transactions/${txRef.key}`] = {
            amount: prize,
            type: 'credit',
            description: `Match Prize: ${t?.title}`,
            timestamp: Date.now()
          };
        }
      }

      await db.ref().update(updates);
      logAdminAction('SAVE_PRIZE', `Saved prize for ${uid} in match ${manageResultsId}`);
      alert("Saved!");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const exportCSV = () => {
    const t = tournaments.find(x => x.id === manageResultsId);
    if (!t || !t.participants) return;

    let csv = "Username,App ID,Game Username,Rank,Kills,Prize,Flagged\n";
    Object.entries(t.participants).forEach(([uid, p]: [string, any]) => {
      csv += `${p.username},${p.appId},${p.gameUsername},${p.result || 'N/A'},${p.kills || 0},${p.prize || 0},${p.flagged ? 'Yes' : 'No'}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `results_${t.title.replace(/\s+/g, '_')}.csv`;
    a.click();
    logAdminAction('EXPORT_CSV', `Exported results for match ${manageResultsId}`);
  };

  const finishMatch = async () => {
    if (!manageResultsId || !window.confirm("Mark match as completed?")) return;
    try {
      await db.ref(`tournaments/${manageResultsId}`).update({ status: 'Completed' });
      setManageResultsId(null);
      logAdminAction('FINISH_MATCH', `Marked match ${manageResultsId} as Completed`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const selectedTournament = tournaments.find(t => t.id === viewPlayers);
  const resultsTournament = tournaments.find(t => t.id === manageResultsId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border shadow-sm">
        <h2 className="text-xl font-black uppercase tracking-tighter">Matches</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">{showForm ? 'Close' : 'Create'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[2rem] border shadow-xl space-y-3 animate-in slide-in-from-top-4 duration-300">
          <input type="text" placeholder="Match Title" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold outline-none" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
          <select className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold outline-none" value={formData.game} onChange={e => setFormData({ ...formData, game: e.target.value })} required>
            <option value="" disabled>Select Category</option>
            {gameModes.map(mode => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
            {gameModes.length === 0 && (
              <>
                <option value="BATTLE ROYALE">BATTLE ROYALE</option>
                <option value="FF SURVIVAL">FF SURVIVAL</option>
                <option value="CS 4V4">CS 4V4</option>
              </>
            )}
          </select>
          <div className="grid grid-cols-3 gap-2">
            <input type="number" placeholder="Fee" className="p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.entryFee} onChange={e => setFormData({ ...formData, entryFee: parseFloat(e.target.value) })} required />
            <input type="number" placeholder="Pool" className="p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.prizePool} onChange={e => setFormData({ ...formData, prizePool: parseFloat(e.target.value) })} required />
            <input type="number" placeholder="Per Kill" className="p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.perKillPrize} onChange={e => setFormData({ ...formData, perKillPrize: parseFloat(e.target.value) })} required />
          </div>
          <input type="datetime-local" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={formData.matchTime} onChange={e => setFormData({ ...formData, matchTime: e.target.value })} required />
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Match Banner (File or URL)</label>
            <input type="file" ref={fileInputRef} accept="image/*" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" />
            <div className="text-center text-[10px] font-black text-gray-300 uppercase">OR</div>
            <input type="text" placeholder="Paste Image URL..." className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold outline-none" value={formData.thumbnail} onChange={e => setFormData({ ...formData, thumbnail: e.target.value })} />
          </div>
          <button type="submit" disabled={isUploading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg disabled:opacity-50">
            {isUploading ? 'Uploading...' : 'Publish Match'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {tournaments.reverse().map(t => (
          <div key={t.id} className="bg-white p-5 rounded-[2rem] border shadow-sm">
            <div className="flex gap-4 mb-4">
              <img 
                src={t.imageUrl || t.thumbnail || `https://picsum.photos/seed/${t.id}/400/180`} 
                className="w-16 h-16 object-cover rounded-2xl border bg-gray-50" 
                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150')}
              />
              <div className="flex-1">
                <h4 className="font-black text-gray-900 uppercase tracking-tighter text-sm">{t.title}</h4>
                <p className="text-[9px] text-gray-400 font-bold uppercase">{new Date(t.matchTime).toLocaleString()}</p>
              </div>
              <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${t.status === 'Live' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>{t.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => updateStatus(t.id, 'Live')} className="py-2.5 bg-red-600 text-white text-[9px] font-black rounded-xl uppercase">Go Live</button>
              <button onClick={() => setManageResultsId(t.id)} className="py-2.5 bg-green-600 text-white text-[9px] font-black rounded-xl uppercase">Results</button>
              <button onClick={() => setViewPlayers(t.id)} className="py-2.5 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-xl uppercase">Players</button>
              <button onClick={() => openEditModal(t)} className="py-2.5 bg-gray-100 text-gray-600 text-[9px] font-black rounded-xl uppercase">Edit</button>
              <button onClick={() => db.ref(`tournaments/${t.id}`).remove()} className="py-2.5 bg-red-50 text-red-600 text-[9px] font-black rounded-xl uppercase col-span-2">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {viewPlayers && selectedTournament && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 relative max-h-[80vh] overflow-y-auto">
             <button onClick={() => setViewPlayers(null)} className="absolute top-6 right-6 text-gray-400"><i className="fas fa-times"></i></button>
             <h3 className="text-lg font-black mb-6 uppercase tracking-tighter">Players: {selectedTournament.participants ? Object.keys(selectedTournament.participants).length : 0}</h3>
             <div className="space-y-3">
                {Object.entries(selectedTournament.participants || {}).map(([uid, p]: [string, any]) => (
                  <div key={uid} className="bg-gray-50 p-4 rounded-2xl border flex justify-between items-center">
                    <div>
                      <p className="text-[11px] font-black text-gray-900 uppercase">{p.gameUsername}</p>
                      <p className="text-[9px] text-indigo-600 font-black">ID: {p.appId}</p>
                      {p.resultScreenshot && <a href={p.resultScreenshot} target="_blank" className="text-[8px] text-blue-500 underline font-black uppercase mt-1 block">View Proof</a>}
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {editMatchId && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setEditMatchId(null)} className="absolute top-6 right-6 text-gray-400"><i className="fas fa-times"></i></button>
            <h3 className="text-lg font-black mb-6 uppercase tracking-tighter">Edit Match</h3>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <input type="text" placeholder="Match Title" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold outline-none" value={editFormData.title} onChange={e => setEditFormData({ ...editFormData, title: e.target.value })} required />
              <select className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold outline-none" value={editFormData.game} onChange={e => setEditFormData({ ...editFormData, game: e.target.value })} required>
                {gameModes.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
                {gameModes.length === 0 && (
                  <>
                    <option value="BATTLE ROYALE">BATTLE ROYALE</option>
                    <option value="FF SURVIVAL">FF SURVIVAL</option>
                    <option value="CS 4V4">CS 4V4</option>
                  </>
                )}
              </select>
              <div className="grid grid-cols-3 gap-2">
                <input type="number" placeholder="Fee" className="p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={editFormData.entryFee} onChange={e => setEditFormData({ ...editFormData, entryFee: parseFloat(e.target.value) })} required />
                <input type="number" placeholder="Pool" className="p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={editFormData.prizePool} onChange={e => setEditFormData({ ...editFormData, prizePool: parseFloat(e.target.value) })} required />
                <input type="number" placeholder="Per Kill" className="p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={editFormData.perKillPrize} onChange={e => setEditFormData({ ...editFormData, perKillPrize: parseFloat(e.target.value) })} required />
              </div>
              <input type="datetime-local" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" value={editFormData.matchTime} onChange={e => setEditFormData({ ...editFormData, matchTime: e.target.value })} required />
              <select className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold outline-none" value={editFormData.status} onChange={e => setEditFormData({ ...editFormData, status: e.target.value as any })} required>
                <option value="Upcoming">Upcoming</option>
                <option value="Live">Live</option>
                <option value="Completed">Completed</option>
              </select>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Match Banner (File or URL)</label>
                <input type="file" ref={editFileInputRef} accept="image/*" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold" />
                <div className="text-center text-[10px] font-black text-gray-300 uppercase">OR</div>
                <input type="text" placeholder="Paste Image URL..." className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold outline-none" value={editFormData.imageUrl} onChange={e => setEditFormData({ ...editFormData, imageUrl: e.target.value })} />
              </div>
              <button type="submit" disabled={isUploading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg disabled:opacity-50">
                {isUploading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {manageResultsId && resultsTournament && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 relative max-h-[90vh] flex flex-col">
            <button onClick={() => setManageResultsId(null)} className="absolute top-6 right-6 text-gray-400"><i className="fas fa-times"></i></button>
            <h3 className="text-lg font-black mb-4 uppercase tracking-tighter">Manage Results</h3>
            
            <div className="mb-4 space-y-2">
              <label className="text-[8px] font-black uppercase text-gray-400">Commentary</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Add comment..." 
                  className="flex-1 p-3 bg-gray-50 border rounded-xl text-[10px] font-bold outline-none"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                />
                <button onClick={addComment} className="px-4 bg-indigo-600 text-white text-[8px] font-black uppercase rounded-xl">Post</button>
              </div>
              <div className="max-h-20 overflow-y-auto space-y-1">
                {Object.values(resultsTournament.adminComments || {}).reverse().map((c: any, i) => (
                  <div key={i} className="bg-gray-50 p-2 rounded-lg text-[8px] font-bold text-gray-600">
                    <span className="text-indigo-600">{new Date(c.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}:</span> {c.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 no-scrollbar border-t pt-4">
              {Object.entries(resultsTournament.participants || {}).map(([uid, p]: [string, any]) => (
                <div key={uid} className={`p-4 rounded-2xl border ${p.flagged ? 'border-red-200 bg-red-50' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[10px] font-black text-gray-900 uppercase">{p.gameUsername} {p.flagged && '⚠️'}</p>
                      <p className="text-[8px] text-gray-400 font-bold uppercase">ID: {p.appId}</p>
                      {p.resultScreenshot && <a href={p.resultScreenshot} target="_blank" className="text-[7px] font-black text-blue-600 underline uppercase mt-1 inline-block" rel="noreferrer">Proof</a>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => kickPlayer(uid)} className="p-1.5 bg-red-100 text-red-600 text-[7px] font-black rounded uppercase">Kick</button>
                      <button onClick={() => flagPlayer(uid, !p.flagged)} className={`p-1.5 ${p.flagged ? 'bg-gray-200 text-gray-600' : 'bg-yellow-100 text-yellow-600'} text-[7px] font-black rounded uppercase`}>
                        {p.flagged ? 'Unflag' : 'Flag'}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input 
                      id={`kills-${uid}`}
                      type="number" 
                      placeholder="Kills" 
                      defaultValue={p.kills || 0}
                      onBlur={e => {
                        const kills = parseInt(e.target.value) || 0;
                        const prize = parseFloat((document.getElementById(`prize-${uid}`) as HTMLInputElement).value) || 0;
                        savePrize(uid, kills, prize);
                      }}
                      className="p-2 text-[9px] font-bold border rounded-lg bg-white outline-none"
                    />
                    <input 
                      id={`prize-${uid}`}
                      type="number" 
                      placeholder="Prize" 
                      defaultValue={p.prize || 0}
                      onBlur={e => {
                        const prize = parseFloat(e.target.value) || 0;
                        const kills = parseInt((document.getElementById(`kills-${uid}`) as HTMLInputElement)?.value || '0') || 0;
                        savePrize(uid, kills, prize);
                      }}
                      className="p-2 text-[9px] font-bold border rounded-lg bg-white outline-none"
                    />
                    <button className="bg-indigo-600 text-white text-[8px] font-black rounded-lg uppercase">Saved</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button onClick={exportCSV} className="py-3 bg-gray-100 text-gray-600 text-[9px] font-black uppercase rounded-xl border">Export CSV</button>
              <button onClick={finishMatch} className="py-3 bg-green-600 text-white text-[9px] font-black uppercase rounded-xl">Finish Match</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManageTournaments;
