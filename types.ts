
export interface UserData {
  uid: string;
  appId: string;
  username: string;
  email: string;
  wallet_deposit: number;
  wallet_winnings: number;
  role: 'user' | 'admin';
  createdAt: number;
  banUntil?: number;
  banReason?: string;
  // Stats & Progression
  totalKills: number;
  totalWins: number;
  matchesPlayed: number;
  referredBy?: string;
  referralCount: number;
}

export interface ChatMessage {
  senderId: string;
  senderName: string;
  senderAppId: string;
  role: 'user' | 'admin';
  text: string;
  timestamp: number;
}

export interface GlobalChatMessage extends ChatMessage {}

export interface Tournament {
  id: string;
  title: string;
  game: string;
  category: string;
  entryFee: number;
  prizePool: number;
  perKillPrize: number; // Reward per kill
  matchTime: string;
  status: 'Upcoming' | 'Live' | 'Completed';
  thumbnail: string;
  imageUrl?: string;
  roomId?: string;
  roomPassword?: string;
  winnerUid?: string;
  adminComments?: Record<string, { text: string; timestamp: number }>;
  participants: Record<string, { 
    username: string;
    appId: string;
    gameUid: string;
    gameUsername: string;
    kills?: number;
    prize?: number;
    result?: string;
    flagged?: boolean;
    statsProcessed?: boolean;
    resultSubmitted?: boolean;
    resultScreenshot?: string;
  }>;
}

export interface PaymentProof {
  id: string;
  winnerName: string;
  amount: number;
  imageUrl: string;
  timestamp: number;
}

export interface WalletRequest {
  id: string;
  uid: string;
  username: string;
  appId: string;
  amount: number;
  type: 'deposit' | 'withdraw';
  status: 'pending' | 'approved' | 'rejected';
  txnId?: string;
  upiId?: string;
  createdAt: number;
}

export interface AppSettings {
  qrCodeUrl: string;
  referralBonus: number;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  timestamp: number;
}

export interface Ticket {
  id: string;
  uid: string;
  username: string;
  appId: string;
  status: 'open' | 'resolved';
  lastUpdate: number;
  lastMessage: string;
  messages?: Record<string, ChatMessage>;
}
