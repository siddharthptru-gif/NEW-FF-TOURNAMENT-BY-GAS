
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';

interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  details: string;
  timestamp: number;
}

const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const logsRef = db.ref('auditLogs');
    const handleValue = (s: any) => {
      const data = s.val() || {};
      setLogs(Object.keys(data).map(key => ({ ...data[key], id: key }))
        .sort((a, b) => b.timestamp - a.timestamp));
    };
    logsRef.on('value', handleValue);
    return () => logsRef.off('value', handleValue);
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex justify-between items-center">
        <h2 className="text-xl font-black uppercase tracking-tighter">Audit Logs</h2>
        <span className="text-[9px] font-black bg-gray-100 text-gray-500 px-2 py-1 rounded uppercase">System Events</span>
      </div>

      <div className="space-y-2">
        {logs.map(log => (
          <div key={log.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-1">
              <p className="text-[10px] font-black text-indigo-600 uppercase">{log.action}</p>
              <p className="text-[8px] text-gray-400 font-bold">{new Date(log.timestamp).toLocaleString()}</p>
            </div>
            <p className="text-[11px] text-gray-800 font-medium">{log.details}</p>
            <p className="text-[8px] text-gray-400 mt-1 uppercase font-bold">Admin: {log.adminId}</p>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <p className="text-gray-400 text-xs uppercase font-black">No logs found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogs;
