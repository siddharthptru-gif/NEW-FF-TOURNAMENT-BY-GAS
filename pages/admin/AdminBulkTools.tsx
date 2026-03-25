
import React, { useState } from 'react';
import { db } from '../../firebase';

const AdminBulkTools: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [creditAmount, setCreditAmount] = useState(0);

  const logAdminAction = async (action: string, details: string) => {
    try {
      const logRef = db.ref('auditLogs').push();
      await logRef.set({
        adminId: 'admin',
        action,
        details,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error("Failed to log action:", err);
    }
  };

  const sendBulkAnnouncement = async () => {
    if (!announcement.trim()) return;
    setLoading(true);
    try {
      const annRef = db.ref('announcements').push();
      await annRef.set({
        text: announcement,
        timestamp: Date.now(),
        type: 'admin'
      });
      setAnnouncement('');
      alert("Announcement published!");
      logAdminAction('BULK_ANNOUNCEMENT', announcement);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendBulkNotification = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) return;
    setLoading(true);
    try {
      const snap = await db.ref('users').once('value');
      const users = snap.val();
      if (users) {
        const updates: any = {};
        const notifId = db.ref().push().key;
        const notificationData = {
          title: notifTitle,
          body: notifBody,
          timestamp: Date.now(),
          read: false
        };
        Object.keys(users).forEach(uid => {
          updates[`userNotifications/${uid}/${notifId}`] = notificationData;
        });
        await db.ref().update(updates);
        setNotifTitle('');
        setNotifBody('');
        alert("Notification sent to all users!");
        logAdminAction('BULK_NOTIFICATION', `${notifTitle}: ${notifBody}`);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const bulkCredit = async () => {
    if (creditAmount <= 0) return;
    if (!window.confirm(`Are you sure you want to credit ₹${creditAmount} to ALL users?`)) return;
    setLoading(true);
    try {
      const snap = await db.ref('users').once('value');
      const users = snap.val();
      if (users) {
        const updates: any = {};
        const timestamp = Date.now();
        Object.keys(users).forEach(uid => {
          const current = users[uid].wallet_deposit || 0;
          updates[`users/${uid}/wallet_deposit`] = current + creditAmount;
          
          const txRef = db.ref().push().key;
          updates[`users/${uid}/transactions/${txRef}`] = {
            amount: creditAmount,
            type: 'credit',
            description: 'Bulk Admin Credit',
            timestamp
          };
        });
        await db.ref().update(updates);
        setCreditAmount(0);
        alert(`Credited ₹${creditAmount} to all users!`);
        logAdminAction('BULK_CREDIT', `₹${creditAmount} to all users`);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteCompletedMatches = async () => {
    if (!window.confirm("DANGER: This will delete ALL completed matches. Continue?")) return;
    setLoading(true);
    try {
      const snap = await db.ref('tournaments').orderByChild('status').equalTo('Completed').once('value');
      const matches = snap.val();
      if (matches) {
        const updates: any = {};
        Object.keys(matches).forEach(id => {
          updates[`tournaments/${id}`] = null;
        });
        await db.ref().update(updates);
        alert("All completed matches deleted!");
        logAdminAction('DELETE_COMPLETED_MATCHES', 'Deleted all completed matches');
      } else {
        alert("No completed matches found.");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[2rem] border shadow-sm">
        <h3 className="text-sm font-black uppercase mb-4 tracking-tighter text-gray-800">Bulk Announcement</h3>
        <div className="space-y-3">
          <textarea 
            placeholder="Type announcement here..." 
            className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
            value={announcement}
            onChange={e => setAnnouncement(e.target.value)}
          />
          <button 
            onClick={sendBulkAnnouncement}
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Publish to Feed'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border shadow-sm">
        <h3 className="text-sm font-black uppercase mb-4 tracking-tighter text-gray-800">Bulk Notification</h3>
        <div className="space-y-3">
          <input 
            type="text" 
            placeholder="Notification Title" 
            className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            value={notifTitle}
            onChange={e => setNotifTitle(e.target.value)}
          />
          <textarea 
            placeholder="Notification Body" 
            className="w-full p-4 bg-gray-50 border rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
            value={notifBody}
            onChange={e => setNotifBody(e.target.value)}
          />
          <button 
            onClick={sendBulkNotification}
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Send to All Users'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border shadow-sm">
        <h3 className="text-sm font-black uppercase mb-4 tracking-tighter text-gray-800">Bulk Wallet Credit</h3>
        <div className="space-y-3">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">₹</span>
            <input 
              type="number" 
              placeholder="Amount to credit" 
              className="w-full pl-8 pr-4 py-4 bg-gray-50 border rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-green-500"
              value={creditAmount}
              onChange={e => setCreditAmount(parseFloat(e.target.value) || 0)}
            />
          </div>
          <button 
            onClick={bulkCredit}
            disabled={loading}
            className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Credit All Users'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border shadow-sm border-red-100">
        <h3 className="text-sm font-black uppercase mb-4 tracking-tighter text-red-600">Cleanup Tools</h3>
        <button 
          onClick={deleteCompletedMatches}
          disabled={loading}
          className="w-full py-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Delete All Completed Matches'}
        </button>
      </div>
    </div>
  );
};

export default AdminBulkTools;
