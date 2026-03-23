
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { UserData, Transaction, AppSettings } from '../../types';

const UserWallet: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'add' | 'withdraw' | 'history'>('add');
  
  const [addAmount, setAddAmount] = useState('');
  const [txnId, setTxnId] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Image handling state
  const [qrSrc, setQrSrc] = useState<string>("https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PAY_ARENA_PRO");
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const userRef = db.ref(`users/${user.uid}`);
      userRef.on('value', (snapshot) => setUserData(snapshot.val()));

      const txRef = db.ref(`users/${user.uid}/transactions`);
      txRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list = Object.keys(data).map(key => ({ ...data[key], id: key }));
          setTransactions(list.sort((a, b) => (b as any).timestamp - (a as any).timestamp));
        }
      });
    }

    const settingsRef = db.ref('settings');
    settingsRef.on('value', (snapshot) => {
      const val = snapshot.val();
      setSettings(val);
      if (val?.qrCodeUrl && val.qrCodeUrl.trim() !== "") {
        setQrSrc(val.qrCodeUrl);
        setImgError(false); // Reset error state on new URL
      }
    });

    return () => {
      if (user) {
        db.ref(`users/${user.uid}`).off();
        db.ref(`users/${user.uid}/transactions`).off();
      }
      db.ref('settings').off();
    };
  }, []);

  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addAmount || !txnId || !userData) return;
    setLoading(true);

    try {
      const reqRef = db.ref('addMoneyRequests').push();
      await reqRef.set({
        uid: auth.currentUser?.uid,
        username: userData.username,
        appId: userData.appId, // Required for admin visibility
        amount: parseFloat(addAmount),
        txnId: txnId,
        status: 'pending',
        type: 'deposit',
        createdAt: Date.now()
      });
      alert("Deposit request submitted! Admin will verify your Txn ID.");
      setAddAmount('');
      setTxnId('');
      setActiveTab('history');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || !upiId || !userData) return;
    const amount = parseFloat(withdrawAmount);
    if (amount < 100) return alert("Minimum withdrawal is ₹100");
    if (amount > (userData.wallet_winnings || 0)) return alert("Insufficient winnings balance!");
    
    setLoading(true);
    try {
      const reqRef = db.ref('withdrawRequests').push();
      await reqRef.set({
        uid: auth.currentUser?.uid,
        username: userData.username,
        appId: userData.appId, // Required for admin visibility
        amount: amount,
        upiId: upiId,
        status: 'pending',
        type: 'withdraw',
        createdAt: Date.now()
      });
      alert("Withdraw request submitted successfully!");
      setWithdrawAmount('');
      setUpiId('');
      setActiveTab('history');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = (userData?.wallet_deposit || 0) + (userData?.wallet_winnings || 0);

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      {/* Wallet Card */}
      <div className="bg-gradient-to-br from-indigo-700 to-blue-500 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <i className="fas fa-wallet text-9xl -rotate-12"></i>
        </div>
        <div className="relative z-10">
          <p className="text-white/70 text-xs font-black uppercase tracking-widest mb-1">Total Balance</p>
          <h2 className="text-5xl font-black mb-8 tracking-tight">₹{totalBalance.toFixed(2)}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/20">
              <p className="text-[10px] text-white/50 uppercase font-black mb-1">Deposit Wallet</p>
              <p className="text-xl font-bold">₹{(userData?.wallet_deposit || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/20">
              <p className="text-[10px] text-white/50 uppercase font-black mb-1">Winnings</p>
              <p className="text-xl font-bold text-green-300">₹{(userData?.wallet_winnings || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
        <button onClick={() => setActiveTab('add')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'add' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}>Add Funds</button>
        <button onClick={() => setActiveTab('withdraw')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'withdraw' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}>Withdraw</button>
        <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}>History</button>
      </div>

      {/* Content Area */}
      <div className="mt-4">
        {activeTab === 'add' && (
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-6">
            <div className="text-center">
              <h3 className="text-sm font-black uppercase text-gray-800 mb-2">Deposit via UPI</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Scan QR & Enter UTR below</p>
              
              <div className="bg-white p-4 rounded-[2rem] border-4 border-dashed border-gray-100 inline-block mb-4 shadow-inner relative group">
                {!imgError ? (
                  <img 
                    src={qrSrc} 
                    onError={() => setImgError(true)}
                    className="w-48 h-48 mx-auto rounded-xl object-contain"
                    alt="Payment QR"
                  />
                ) : (
                  <div className="w-48 h-48 flex flex-col items-center justify-center bg-gray-50 rounded-xl">
                    <i className="fas fa-qrcode text-4xl text-gray-300 mb-2"></i>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">QR Not Available</p>
                    <p className="text-[8px] text-gray-300">Contact Admin</p>
                  </div>
                )}
                {/* Overlay Instruction */}
                <div className="absolute inset-0 bg-black/5 flex items-center justify-center rounded-[1.7rem] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <p className="bg-white/90 px-3 py-1 rounded-full text-[10px] font-black uppercase text-gray-800 shadow-sm">Scan Me</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleAddMoney} className="space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 ml-3 mb-1 block">Amount to Add</label>
                <input type="number" required value={addAmount} onChange={e => setAddAmount(e.target.value)} placeholder="e.g. 500" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-800" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 ml-3 mb-1 block">Transaction ID / UTR</label>
                <input type="text" required value={txnId} onChange={e => setTxnId(e.target.value)} placeholder="e.g. 321456789012" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-800" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all">
                {loading ? <i className="fas fa-circle-notch fa-spin"></i> : 'Verify Payment'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'withdraw' && (
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-6">
            <div className="bg-yellow-50 p-5 rounded-2xl border border-yellow-100 flex gap-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
                <i className="fas fa-exclamation text-yellow-600"></i>
              </div>
              <div>
                 <h4 className="text-xs font-black text-yellow-800 uppercase mb-1">Important Note</h4>
                 <p className="text-[10px] font-bold text-yellow-700 leading-relaxed">Minimum withdrawal is ₹100. You can only withdraw from your "Winnings" wallet. Deposits cannot be withdrawn.</p>
              </div>
            </div>
            
            <form onSubmit={handleWithdraw} className="space-y-4">
               <div>
                <label className="text-[9px] font-black uppercase text-gray-400 ml-3 mb-1 block">Withdraw Amount</label>
                <input type="number" required value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="Min ₹100" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-gray-400 transition-all text-gray-800" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 ml-3 mb-1 block">UPI ID / VPA</label>
                <input type="text" required value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="e.g. username@okhdfc" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-gray-400 transition-all text-gray-800" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-gray-200 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all">
                 {loading ? <i className="fas fa-circle-notch fa-spin"></i> : 'Request Payout'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {transactions.map(tx => (
              <div key={tx.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.type === 'credit' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    <i className={`fas ${tx.type === 'credit' ? 'fa-arrow-down' : 'fa-arrow-up'} text-sm`}></i>
                  </div>
                  <div>
                    <h4 className="font-black text-gray-800 text-xs uppercase truncate max-w-[140px] mb-0.5">{tx.description}</h4>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">{new Date(tx.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                    <p className={`font-black text-sm ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount.toFixed(0)}
                    </p>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${tx.type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{tx.type}</span>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
                <div className="text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                    <i className="fas fa-receipt text-3xl text-gray-200 mb-3"></i>
                    <p className="text-gray-300 font-black uppercase text-xs">No transactions found</p>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserWallet;
