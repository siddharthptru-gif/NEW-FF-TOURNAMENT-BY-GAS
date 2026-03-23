
import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../firebase';
import { Ticket, ChatMessage, UserData } from '../../types';

const UserSupport: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Check for an open ticket for this user
    const ticketsRef = db.ref('tickets');
    const query = ticketsRef.orderByChild('uid').equalTo(user.uid);
    
    const handleValue = (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        // Find the most recent open ticket or any ticket
        const tickets = Object.keys(data).map(key => ({ ...data[key], id: key }));
        const openTicket = tickets.find(t => t.status === 'open') || tickets[0];
        setTicketId(openTicket.id);
        
        if (openTicket.messages) {
          const msgList = Object.values(openTicket.messages) as ChatMessage[];
          setMessages(msgList.sort((a, b) => a.timestamp - b.timestamp));
        }
      }
      setLoading(false);
    };

    query.on('value', handleValue);
    return () => query.off('value', handleValue);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const user = auth.currentUser;
    if (!user) return;

    try {
      // Fix: Fetch userData to ensure we have the correct appId for ChatMessage
      const userSnap = await db.ref(`users/${user.uid}`).once('value');
      const userData: UserData = userSnap.val();

      if (!userData) throw new Error("User data not found.");

      let currentTicketId = ticketId;

      // If no ticket exists, create one
      if (!currentTicketId) {
        const newTicketRef = db.ref('tickets').push();
        currentTicketId = newTicketRef.key;
        await newTicketRef.set({
          uid: user.uid,
          username: userData.username,
          appId: userData.appId,
          status: 'open',
          lastUpdate: Date.now(),
          lastMessage: text.trim()
        });
        setTicketId(currentTicketId);
      }

      const msgRef = db.ref(`tickets/${currentTicketId}/messages`).push();
      const newMsg: ChatMessage = {
        senderId: user.uid,
        senderName: 'You',
        // Fix: Added required senderAppId property from fetched userData
        senderAppId: userData.appId,
        role: 'user',
        text: text.trim(),
        timestamp: Date.now()
      };

      await msgRef.set(newMsg);
      await db.ref(`tickets/${currentTicketId}`).update({
        lastUpdate: Date.now(),
        lastMessage: text.trim(),
        status: 'open' // Reopen if it was resolved
      });
      
      setText('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><i className="fas fa-spinner animate-spin text-2xl text-blue-500"></i></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider">Support Chat</h3>
          <p className="text-[10px] opacity-70">Average response time: 15 mins</p>
        </div>
        <i className="fas fa-headset text-xl opacity-50"></i>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-comments text-2xl"></i>
            </div>
            <p className="text-gray-500 text-sm font-medium">Hello! How can we help you today?</p>
            <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Type your message below to start</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
              }`}>
                <p className="font-medium">{msg.text}</p>
                <p className={`text-[8px] mt-1 text-right ${msg.role === 'user' ? 'text-white/50' : 'text-gray-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
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
  );
};

export default UserSupport;
