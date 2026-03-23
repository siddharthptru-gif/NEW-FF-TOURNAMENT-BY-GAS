
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { UserData } from './types';
import firebase from 'firebase/compat/app';

// Layouts & Pages
import UserLayout from './components/UserLayout';
import AdminLayout from './components/AdminLayout';
import LoginPage from './pages/LoginPage';
import UserHome from './pages/user/UserHome';
import UserMyMatches from './pages/user/UserMyMatches';
import UserWallet from './pages/user/UserWallet';
import UserProfile from './pages/user/UserProfile';
import UserSupport from './pages/user/UserSupport';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminManageTournaments from './pages/admin/AdminManageTournaments';
import AdminRequests from './pages/admin/AdminRequests';
import AdminSettings from './pages/admin/AdminSettings';
import AdminTickets from './pages/admin/AdminTickets';
import AdminLogs from './pages/admin/AdminLogs';
import AdminLeaderboard from './pages/admin/AdminLeaderboard';
import AdminReports from './pages/admin/AdminReports';
import AdminMatchImages from './pages/admin/AdminMatchImages';
import AdminDynamicFeatures from './pages/admin/AdminDynamicFeatures';

const App: React.FC = () => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = db.ref(`users/${currentUser.uid}`);
        const handleValue = (snapshot: any) => {
          const data = snapshot.val();
          if (data) {
            setUserData({ ...data, uid: currentUser.uid });
          }
          setLoading(false);
        };
        userRef.on('value', handleValue);
        return () => userRef.off('value', handleValue);
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={!user ? <LoginPage /> : <Navigate to="/" />} 
        />

        <Route 
          path="/" 
          element={user && userData?.role === 'user' ? <UserLayout /> : (user && userData?.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/login" />)}
        >
          <Route index element={<UserHome />} />
          <Route path="home" element={<UserHome />} />
          <Route path="matches" element={<UserMyMatches />} />
          <Route path="wallet" element={<UserWallet />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="support" element={<UserSupport />} />
        </Route>

        <Route 
          path="/admin" 
          element={user && userData?.role === 'admin' ? <AdminLayout /> : <Navigate to="/login" />}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="tournaments" element={<AdminManageTournaments />} />
          <Route path="match-images" element={<AdminMatchImages />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="tickets" element={<AdminTickets />} />
          <Route path="logs" element={<AdminLogs />} />
          <Route path="leaderboard" element={<AdminLeaderboard />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
