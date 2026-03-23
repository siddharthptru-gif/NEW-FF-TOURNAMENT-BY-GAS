
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { Tournament } from '../../types';

const AdminMatchImages: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tourRef = db.ref('tournaments');
    const handleValue = (snapshot: any) => {
      const data = snapshot.val() || {};
      setTournaments(Object.keys(data).map(key => ({ ...data[key], id: key })));
      setLoading(false);
    };
    tourRef.on('value', handleValue);
    return () => tourRef.off('value', handleValue);
  }, []);

  const updateThumbnail = async (id: string, url: string) => {
    if (!url.trim()) return alert("Please enter a valid URL");
    try {
      await db.ref(`tournaments/${id}`).update({ thumbnail: url });
      alert("Thumbnail updated successfully!");
    } catch (error: any) {
      alert("Error updating thumbnail: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border shadow-sm">
        <h2 className="text-xl font-black uppercase tracking-tighter mb-2">Match Images</h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Update tournament thumbnails instantly using URLs</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tournaments.reverse().map(t => (
          <div key={t.id} className="bg-white p-5 rounded-[2rem] border shadow-sm flex flex-col sm:flex-row gap-4 items-center">
            <div className="w-full sm:w-32 h-20 rounded-2xl overflow-hidden border bg-gray-50 flex-shrink-0">
              <img 
                src={t.thumbnail || `https://picsum.photos/seed/${t.id}/400/180`} 
                className="w-full h-full object-cover" 
                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/400x180?text=Invalid+URL')}
              />
            </div>
            <div className="flex-1 w-full space-y-3">
              <div>
                <h4 className="font-black text-gray-900 uppercase tracking-tighter text-sm">{t.title}</h4>
                <p className="text-[9px] text-gray-400 font-bold uppercase">{t.game || t.category}</p>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  id={`url-${t.id}`}
                  placeholder="Paste Image URL here..." 
                  defaultValue={t.thumbnail || ''}
                  className="flex-1 p-3 bg-gray-50 border rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  onClick={() => {
                    const input = document.getElementById(`url-${t.id}`) as HTMLInputElement;
                    updateThumbnail(t.id, input.value);
                  }}
                  className="px-4 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-xl shadow-sm hover:bg-indigo-700 transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        ))}
        {tournaments.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed">
            <p className="text-gray-400 font-black text-xs uppercase">No matches found to manage</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMatchImages;
