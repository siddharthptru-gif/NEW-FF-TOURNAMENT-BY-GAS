
import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { UserData } from '../types';
import firebase from 'firebase/compat/app';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateAppId = () => Math.floor(100000 + Math.random() * 900000).toString();

  const checkUsernameUnique = async (uname: string) => {
    const snap = await db.ref(`usernames/${uname.toLowerCase()}`).once('value');
    return !snap.exists();
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const userCredential = await auth.signInWithPopup(provider);
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

        if (!userData) {
          // New user from Google Login
          const appId = generateAppId();
          const role = user.email?.includes('admin') ? 'admin' : 'user';
          let baseUsername = user.displayName || user.email?.split('@')[0] || 'Gamer';
          baseUsername = baseUsername.replace(/\s+/g, '').toLowerCase();
          
          // Ensure uniqueness for Google users too
          let finalUsername = baseUsername;
          let isUnique = await checkUsernameUnique(finalUsername);
          let counter = 1;
          while (!isUnique) {
            finalUsername = `${baseUsername}${counter}`;
            isUnique = await checkUsernameUnique(finalUsername);
            counter++;
          }

          const newUser: Partial<UserData> = {
            appId, 
            username: finalUsername, 
            email: user.email || '', 
            role,
            wallet_deposit: 0, wallet_winnings: 0,
            totalKills: 0, totalWins: 0, matchesPlayed: 0, referralCount: 0,
            createdAt: Date.now()
          };

          const updates: any = {};
          updates[`users/${user.uid}`] = newUser;
          updates[`usernames/${finalUsername.toLowerCase()}`] = user.uid;
          
          await db.ref().update(updates);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
        // Signup
        const cleanUsername = username.trim().toLowerCase();
        if (cleanUsername.length < 3) {
          throw new Error("Username must be at least 3 characters.");
        }
        
        const isUnique = await checkUsernameUnique(cleanUsername);
        if (!isUnique) {
          throw new Error("Username is already taken. Please choose another.");
        }

        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        if (user) {
          const appId = generateAppId();
          const role = email.includes('admin') ? 'admin' : 'user';
          
          const newUser: Partial<UserData> = {
            appId, 
            username: username.trim(), 
            email, 
            role,
            wallet_deposit: 0, wallet_winnings: 0,
            totalKills: 0, totalWins: 0, matchesPlayed: 0, referralCount: 0,
            createdAt: Date.now()
          };

          const updates: any = {};
          updates[`users/${user.uid}`] = newUser;
          updates[`usernames/${cleanUsername}`] = user.uid;

          await db.ref().update(updates);
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

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500 font-bold uppercase">Or continue with</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleLogin} 
          disabled={loading}
          className="mt-6 w-full py-4 bg-white border-2 border-gray-100 text-gray-700 rounded-2xl font-black uppercase shadow-sm hover:bg-gray-50 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Google
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
