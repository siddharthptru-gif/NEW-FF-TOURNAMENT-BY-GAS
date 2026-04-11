
import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../firebase';
import { Ticket, ChatMessage, UserData } from '../../types';

const UserSupport: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const ticketsRef = db.ref('supportTickets');
    const query = ticketsRef.orderByChild('uid').equalTo(user.uid);
    
    const handleValue = (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        const ticketList = Object.keys(data).map(key => ({ ...data[key], id: key }))
          .sort((a, b) => b.createdAt - a.createdAt);
        setTickets(ticketList);
      } else {
        setTickets([]);
      }
      setLoading(false);
    };

    query.on('value', handleValue);
    return () => query.off('value', handleValue);
  }, []);

  useEffect(() => {
    if (selectedTicketId) {
      const msgsRef = db.ref(`supportMessages/${selectedTicketId}`);
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
    } else {
      setMessages([]);
    }
  }, [selectedTicketId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createTicket = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userSnap = await db.ref(`users/${user.uid}`).once('value');
      const userData: UserData = userSnap.val();
      if (!userData) throw new Error("User data not found.");

      const newTicketRef = db.ref('supportTickets').push();
      const newTicketId = newTicketRef.key;
      await newTicketRef.set({
        uid: user.uid,
        username: userData.username,
        appId: userData.appId,
        status: 'Open',
        createdAt: Date.now(),
        lastUpdate: Date.now(),
        lastMessage: 'Ticket created.'
      });

      await db.ref(`supportMessages/${newTicketId}`).push({
        sender: 'system',
        text: 'Ticket created. A support agent will be with you shortly.',
        timestamp: Date.now(),
        role: 'system'
      });

      setSelectedTicketId(newTicketId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !selectedTicketId) return;

    const user = auth.currentUser;
    if (!user) return;

    try {
      const userSnap = await db.ref(`users/${user.uid}`).once('value');
      const userData: UserData = userSnap.val();
      if (!userData) throw new Error("User data not found.");

      const msgRef = db.ref(`supportMessages/${selectedTicketId}`).push();
      const newMsg: ChatMessage = {
        senderId: user.uid,
        senderName: 'You',
        senderAppId: userData.appId,
        role: 'user',
        text: text.trim(),
        timestamp: Date.now()
      };

      await msgRef.set(newMsg);
      await db.ref(`supportTickets/${selectedTicketId}`).update({
        lastUpdate: Date.now(),
        lastMessage: text.trim(),
        status: 'Open'
      });
      
      setText('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><i className="fas fa-spinner animate-spin text-2xl text-blue-500"></i></div>;

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] gap-4">
      {!selectedTicketId ? (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg text-gray-800 mb-1">Customer Support</h3>
            <p className="text-xs text-gray-500 mb-4">Need help? Create a ticket and our team will assist you.</p>
            <button 
              onClick={createTicket}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-2xl text-sm uppercase tracking-wider shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors"
            >
              Create New Ticket
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Your Tickets</h4>
            {tickets.length === 0 ? (
              <div className="bg-white p-10 rounded-3xl border border-dashed border-gray-200 text-center">
                <p className="text-gray-400 text-sm">No tickets found.</p>
              </div>
            ) : (
              tickets.map(t => (
                <button 
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className="w-full bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center hover:border-blue-200 transition-all text-left"
                >
                  <div>
                    <h5 className="font-bold text-gray-800 text-sm">Ticket #{t.id.slice(-6).toUpperCase()}</h5>
                    <p className="text-[10px] text-gray-400 mt-0.5">{new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`text-[8px] font-black px-2 py-1 rounded uppercase ${t.status === 'Open' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {t.status}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedTicketId(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <i className="fas fa-arrow-left"></i>
              </button>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider">Ticket Chat</h3>
                <p className="text-[10px] opacity-70">Status: {selectedTicket?.status}</p>
              </div>
            </div>
            <i className="fas fa-headset text-xl opacity-50"></i>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : (msg.role === 'system' ? 'justify-center' : 'justify-start')}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                  msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : (msg.role === 'system' ? 'bg-gray-200 text-gray-500 text-[10px] font-bold py-1 px-4' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none')
                }`}>
                  <p className="font-medium">{msg.text}</p>
                  {msg.role !== 'system' && (
                    <p className={`text-[8px] mt-1 text-right ${msg.role === 'user' ? 'text-white/50' : 'text-gray-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input 
              type="text" 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-gray-50 border-none rounded-2xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button type="submit" className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform">
              <i className="fas fa-paper-plane"></i>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserSupport;
