
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';

interface Report {
  id: string;
  reporterName: string;
  matchId: string;
  reason: string;
  status: 'Pending' | 'Resolved' | 'Dismissed';
  timestamp: number;
}

const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const reportsRef = db.ref('reports');
    const handleValue = (s: any) => {
      const data = s.val() || {};
      const list = Object.keys(data).map(key => ({ ...data[key], id: key }))
        .sort((a, b) => b.timestamp - a.timestamp);
      setReports(list);
    };
    reportsRef.on('value', handleValue);
    return () => reportsRef.off('value', handleValue);
  }, []);

  const resolveReport = async (id: string, status: 'Resolved' | 'Dismissed') => {
    try {
      await db.ref(`reports/${id}`).update({ status });
      // Log action
      const logRef = db.ref('auditLogs').push();
      await logRef.set({
        adminId: 'admin', // Should ideally be from auth
        action: 'RESOLVE_REPORT',
        details: `Report ${id} marked as ${status}`,
        timestamp: Date.now()
      });
      alert(`Report ${status}!`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex justify-between items-center">
        <h2 className="text-xl font-black uppercase tracking-tighter">Anti-Cheat Reports</h2>
        <span className="text-[9px] font-black bg-red-50 text-red-600 px-2 py-1 rounded uppercase">Security Feed</span>
      </div>

      <div className="space-y-4">
        {reports.map(r => (
          <div key={r.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black text-red-700 uppercase">Reported By: {r.reporterName}</p>
                <p className="text-[8px] font-bold text-gray-400 uppercase">Match ID: {r.matchId}</p>
              </div>
              <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${
                r.status === 'Pending' ? 'bg-yellow-100 text-yellow-600' : 
                r.status === 'Resolved' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {r.status}
              </span>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6">
              <p className="text-[11px] font-medium text-gray-800">{r.reason}</p>
              <p className="text-[8px] text-gray-400 mt-2 font-bold uppercase">{new Date(r.timestamp).toLocaleString()}</p>
            </div>

            {r.status === 'Pending' && (
              <div className="flex gap-3">
                <button 
                  onClick={() => resolveReport(r.id, 'Resolved')}
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-green-100"
                >
                  Resolve
                </button>
                <button 
                  onClick={() => resolveReport(r.id, 'Dismissed')}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        ))}
        {reports.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
            <p className="text-gray-400 text-xs uppercase font-black">No reports found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
