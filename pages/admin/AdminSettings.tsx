
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState({ qrCodeUrl: '', minWithdraw: 0, referralBonus: 0, modes: {} as Record<string, string> });
  const [loading, setLoading] = useState(false);
  const [proofData, setProofData] = useState({ name: '', amount: 0, url: '' });
  const [newMode, setNewMode] = useState('');

  useEffect(() => {
    db.ref('settings').on('value', s => {
      const data = s.val() || {};
      setSettings({
        qrCodeUrl: data.qrCodeUrl || '',
        minWithdraw: data.minWithdraw || 0,
        referralBonus: data.referralBonus || 0,
        modes: data.modes || {}
      });
    });
  }, []);

  const updateSettings = async () => {
    setLoading(true);
    await db.ref('settings').update(settings);
    setLoading(false);
    alert("Updated Successfully!");
  };

  const updateModeImg = (mode: string, url: string) => {
    setSettings(prev => ({
      ...prev,
      modes: { ...prev.modes, [mode]: url }
    }));
  };

  const addMode = () => {
    if (!newMode.trim()) return;
    setSettings(prev => ({
      ...prev,
      modes: { ...prev.modes, [newMode.toUpperCase()]: '' }
    }));
    setNewMode('');
  };

  const removeMode = (mode: string) => {
    if (!window.confirm(`Remove ${mode}?`)) return;
    const newModes = { ...settings.modes };
    delete newModes[mode];
    setSettings(prev => ({ ...prev, modes: newModes }));
  };

  const addProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofData.url) return;
    await db.ref('paymentProofs').push({
      winnerName: proofData.name,
      amount: proofData.amount,
      imageUrl: proofData.url,
      timestamp: Date.now()
    });
    setProofData({ name: '', amount: 0, url: '' });
    alert("Proof added to feed!");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[2rem] border shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-black uppercase tracking-tighter text-gray-800">Game Modes & Banners</h3>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="NEW MODE..." 
              className="p-2 bg-gray-50 border rounded-lg text-[9px] font-bold outline-none"
              value={newMode}
              onChange={e => setNewMode(e.target.value)}
            />
            <button onClick={addMode} className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase">Add</button>
          </div>
        </div>
        <div className="space-y-4">
          {Object.keys(settings.modes).map(mode => (
            <div key={mode} className="space-y-1 relative group">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-black uppercase text-gray-400 block">{mode}</label>
                <button onClick={() => removeMode(mode)} className="text-red-500 text-[8px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
              </div>
              <input 
                type="text" 
                className="w-full p-3 bg-gray-50 border rounded-xl text-[10px] font-bold outline-none" 
                value={settings.modes[mode] || ''} 
                onChange={e => updateModeImg(mode, e.target.value)} 
                placeholder="Banner Image URL..." 
              />
            </div>
          ))}
          <button onClick={updateSettings} disabled={loading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Game Modes'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border shadow-sm">
        <h3 className="text-sm font-black uppercase mb-4 tracking-tighter text-gray-800">App Configuration</h3>
        
        <div className="space-y-4">
            <div>
                <label className="text-[9px] font-black uppercase text-gray-400 mb-1 block">UPI QR Code Image URL</label>
                <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={settings.qrCodeUrl} onChange={e => setSettings({...settings, qrCodeUrl: e.target.value})} placeholder="https://..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-[9px] font-black uppercase text-gray-400 mb-1 block">Min Withdrawal (₹)</label>
                    <input type="number" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={settings.minWithdraw} onChange={e => setSettings({...settings, minWithdraw: parseFloat(e.target.value)})} />
                </div>
                <div>
                    <label className="text-[9px] font-black uppercase text-gray-400 mb-1 block">Referral Bonus (₹)</label>
                    <input type="number" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={settings.referralBonus} onChange={e => setSettings({...settings, referralBonus: parseFloat(e.target.value)})} />
                </div>
            </div>
            
            <button onClick={updateSettings} disabled={loading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 disabled:opacity-50">
                {loading ? 'Saving...' : 'Save All Settings'}
            </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border shadow-sm">
        <h3 className="text-sm font-black uppercase mb-4 tracking-tighter text-gray-800">Add Winner Proof</h3>
        <form onSubmit={addProof} className="space-y-3">
          <input type="text" placeholder="Username" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold focus:ring-2 focus:ring-green-500 outline-none" value={proofData.name} onChange={e => setProofData({...proofData, name: e.target.value})} required />
          <input type="number" placeholder="Amount (₹)" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold focus:ring-2 focus:ring-green-500 outline-none" value={proofData.amount} onChange={e => setProofData({...proofData, amount: parseFloat(e.target.value)})} required />
          <input type="text" placeholder="Screenshot URL" className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold focus:ring-2 focus:ring-green-500 outline-none" value={proofData.url} onChange={e => setProofData({...proofData, url: e.target.value})} required />
          <button type="submit" className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-green-100 active:scale-95">Publish to Feed</button>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
