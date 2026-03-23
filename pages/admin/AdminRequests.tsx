
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { WalletRequest, UserData } from '../../types';

const AdminRequests: React.FC = () => {
  const [deposits, setDeposits] = useState<WalletRequest[]>([]);
  const [withdraws, setWithdraws] = useState<WalletRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    const depRef = db.ref('addMoneyRequests');
    const withRef = db.ref('withdrawRequests');

    const handleDeposits = (snap: any) => {
      const data = snap.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ 
          ...data[key], 
          id: key, 
          type: 'deposit' as const 
        }));
        setDeposits(list.sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setDeposits([]);
      }
    };

    const handleWithdraws = (snap: any) => {
      const data = snap.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ 
          ...data[key], 
          id: key, 
          type: 'withdraw' as const 
        }));
        setWithdraws(list.sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setWithdraws([]);
      }
    };

    depRef.on('value', handleDeposits);
    withRef.on('value', handleWithdraws);

    return () => {
      depRef.off('value', handleDeposits);
      withRef.off('value', handleWithdraws);
    };
  }, []);

  const handleAction = async (req: WalletRequest, status: 'approved' | 'rejected') => {
    if (!window.confirm(`Are you sure you want to ${status.toUpperCase()} this request for ₹${req.amount}?`)) return;

    setIsProcessing(req.id);
    try {
      const updates: any = {};
      const path = req.type === 'deposit' ? 'addMoneyRequests' : 'withdrawRequests';
      updates[`${path}/${req.id}/status`] = status;

      if (status === 'approved') {
        const userSnap = await db.ref(`users/${req.uid}`).once('value');
        const userData: UserData = userSnap.val();
        if (!userData) throw new Error("Target user account no longer exists.");

        if (req.type === 'deposit') {
          updates[`users/${req.uid}/wallet_deposit`] = (userData.wallet_deposit || 0) + req.amount;
        } else {
          if ((userData.wallet_winnings || 0) < req.amount) throw new Error("User spent their winnings before approval.");
          updates[`users/${req.uid}/wallet_winnings`] = userData.wallet_winnings - req.amount;
        }

        const txnRef = db.ref(`users/${req.uid}/transactions`).push();
        updates[`users/${req.uid}/transactions/${txnRef.key}`] = {
          amount: req.amount,
          type: req.type === 'deposit' ? 'credit' : 'debit',
          description: req.type === 'deposit' ? 'Deposit Approved' : 'Withdrawal Approved',
          timestamp: Date.now()
        };
      }

      await db.ref().update(updates);
      alert(`Successfully ${status}!`);
    } catch (err: any) {
      alert("System Error: " + err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const requests = activeTab === 'deposit' ? deposits : withdraws;
  const filtered = requests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex bg-white rounded-2xl p-1 shadow-sm border">
        <button onClick={() => setActiveTab('deposit')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'deposit' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400'}`}>Deposits <span className="ml-1 opacity-50">({deposits.filter(d => d.status === 'pending').length})</span></button>
        <button onClick={() => setActiveTab('withdraw')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'withdraw' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400'}`}>Redeems <span className="ml-1 opacity-50">({withdraws.filter(w => w.status === 'pending').length})</span></button>
      </div>

      <div className="space-y-4">
        {filtered.map(req => (
          <div key={req.id} className="bg-white p-6 rounded-[2.5rem] border shadow-sm animate-in slide-in-from-bottom-4 duration-300 relative overflow-hidden">
             <div className={`absolute top-0 left-0 w-1 h-full ${req.type === 'deposit' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div className="flex justify-between items-start mb-4 pl-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-black uppercase tracking-tighter text-gray-900">{req.username}</h4>
                  <span className="bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded-lg tracking-widest">{req.appId || 'NEW'}</span>
                </div>
                <p className="text-[9px] text-gray-400 font-bold uppercase">{new Date(req.createdAt).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-black ${req.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                    {req.type === 'deposit' ? '+' : '-'} ₹{req.amount}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border mb-6 ml-3">
              <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1">{req.type === 'deposit' ? 'Txn Reference' : 'UPI Destination'}</p>
              <p className="text-xs font-black text-gray-800 break-all select-all">{req.type === 'deposit' ? req.txnId : req.upiId}</p>
            </div>

            <div className="flex gap-3 ml-3">
              <button disabled={!!isProcessing} onClick={() => handleAction(req, 'approved')} className="flex-1 py-4 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-green-100 disabled:opacity-50">Approve</button>
              <button disabled={!!isProcessing} onClick={() => handleAction(req, 'rejected')} className="flex-1 py-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase disabled:opacity-50">Reject</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                <i className="fas fa-check-circle text-3xl text-gray-200 mb-3"></i>
                <p className="text-gray-300 font-black uppercase text-xs">All caught up!</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminRequests;
