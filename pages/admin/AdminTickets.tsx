
import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../firebase';
import { Ticket, ChatMessage } from '../../types';

const AdminTickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ticketsRef = db.ref('tickets');
    const handleValue = (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        setTickets(Object.keys(data).map(key => ({ ...data[key], id: key }))
          .sort((a, b) => b.lastUpdate - a.lastUpdate));
      }
    };
    ticketsRef.on('value', handleValue);
    return () => ticketsRef.off('value', handleValue);
  }, []);

  useEffect(() => {
    if (selectedTicketId) {
      const msgsRef = db.ref(`tickets/${selectedTicketId}/messages`);
      const handleMsgs = (snapshot: any) => {
        const data = snapshot.val();
        if (data) {
          const list = Object.values(data) as ChatMessage[];
          setMessages(list.sort((a, b) => a.timestamp - b.timestamp));
        } else {
          setMessages([]);
        }
      };
      msgsRef.on('value', handleMsgs);
      return () => msgsRef.off('value', handleMsgs);
    }
  }, [selectedTicketId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId) return;

    try {
      const msgRef = db.ref(`tickets/${selectedTicketId}/messages`).push();
      const newMsg: ChatMessage = {
        senderId: 'admin',
        senderName: 'Admin Support',
        // Fix: Added required senderAppId property
        senderAppId: 'ADMIN',
        role: 'admin',
        text: replyText.trim(),
        timestamp: Date.now()
      };

      await msgRef.set(newMsg);
      await db.ref(`tickets/${selectedTicketId}`).update({
        lastUpdate: Date.now(),
        lastMessage: replyText.trim()
      });
      setReplyText('');
    } catch (err: any) { alert(err.message); }
  };

  const closeTicket = async () => {
    if (selectedTicketId && window.confirm("Close this ticket?")) {
      await db.ref(`tickets/${selectedTicketId}`).update({ status: 'resolved' });
      setSelectedTicketId(null);
    }
  };

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-4">
      {!selectedTicketId ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Support Center</h2>
          {tickets.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
               <p className="text-gray-400">No support tickets found.</p>
            </div>
          ) : (
            tickets.map(t => (
              <button 
                key={t.id} 
                onClick={() => setSelectedTicketId(t.id)}
                className="w-full bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-800 text-sm truncate">{t.username}</span>
                    <span className="text-[9px] font-mono text-gray-400">#{t.appId}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 truncate font-medium">{t.lastMessage}</p>
                </div>
                <div className="text-right flex flex-col items-end ml-4">
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase mb-1 ${t.status === 'open' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {t.status}
                  </span>
                  <p className="text-[8px] text-gray-400 font-bold">{new Date(t.lastUpdate).toLocaleTimeString()}</p>
                </div>
              </button>
            ))
          )}
        </div>
      ) : (
        <div className="flex flex-col flex-1 bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden relative">
          <div className="bg-gray-900 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedTicketId(null)} className="p-2"><i className="fas fa-arrow-left"></i></button>
              <div>
                <h3 className="font-bold text-sm uppercase">{selectedTicket?.username}</h3>
                <p className="text-[10px] text-gray-400">App ID: {selectedTicket?.appId}</p>
              </div>
            </div>
            <button onClick={closeTicket} className="text-[10px] font-bold bg-white/10 px-3 py-1.5 rounded-xl uppercase hover:bg-white/20">Resolve</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === 'admin' 
                  ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-100' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  <p className="font-medium">{msg.text}</p>
                  <p className={`text-[8px] mt-1 text-right ${msg.role === 'admin' ? 'text-white/50' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={sendReply} className="p-4 border-t flex gap-2">
            <input 
              type="text" 
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type reply..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button type="submit" className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <i className="fas fa-paper-plane"></i>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminTickets;
