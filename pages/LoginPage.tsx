
import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { UserData } from '../types';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateAppId = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        if (user) {
          const userSnap = await db.ref(`users/${user.uid}`).once('value');
          const userData = userSnap.val();
          if (userData?.banUntil && userData.banUntil > Date.now()) {
            await auth.signOut();
            setError(`Banned until ${new Date(userData.banUntil).toLocaleString()}`);
            setLoading(false);
            return;
          }
        }
      } else {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        if (user) {
          const appId = generateAppId();
          const role = email.includes('admin') ? 'admin' : 'user';
          
          const newUser: Partial<UserData> = {
            appId, username, email, role,
            wallet_deposit: 0, wallet_winnings: 0,
            totalKills: 0, totalWins: 0, matchesPlayed: 0, referralCount: 0,
            createdAt: Date.now()
          };

          await db.ref(`users/${user.uid}`).set(newUser);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-white p-8 flex flex-col justify-center">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl mb-4">
          <i className="fas fa-gamepad text-white text-4xl"></i>
        </div>
        <h1 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter">Arena Pro</h1>
      </div>

      <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
        <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 rounded-xl font-bold text-sm ${isLogin ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>LOGIN</button>
        <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 rounded-xl font-bold text-sm ${!isLogin ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>SIGNUP</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100">{error}</div>}
        {!isLogin && (
          <input type="text" placeholder="Username" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none font-bold" value={username} onChange={e => setUsername(e.target.value)} required />
        )}
        <input type="email" placeholder="Email Address" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none font-bold" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none font-bold" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase shadow-lg active:scale-95 disabled:opacity-50">
          {loading ? 'Entering...' : isLogin ? 'Enter Arena' : 'Join Arena'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
