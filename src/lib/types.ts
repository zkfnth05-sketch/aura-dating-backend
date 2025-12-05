import type { Timestamp } from 'firebase/firestore';

export type User = {
  id: string;
  name: string;
  age: number;
  location: string;
  lat: number;
  lng: number;
  bio: string;
  hobbies: string[];
  interests: string[];
  photoUrls: string[];
  gender: '남성' | '여성' | '기타';
  relationship?: string[];
  values?: string[];
  communication?: string[];
  lifestyle?: string[];
  lastSeen?: 'Online' | string; // 'Online' or ISO 8601 date string
  likeCount: number;
  createdAt?: Timestamp;
};

export type Match = {
  id: string;
  users: string[];
  participants: Partial<User>[]; // Store a subset of user data for quick access
  lastMessage: string;
  lastMessageTimestamp: Timestamp;
  unreadCounts: { [key: string]: number };
  matchDate: Timestamp;
  callStatus?: 'idle' | 'ringing' | 'active';
  callerId?: string | null;
};

export type Message = {
  id: string;
  senderId: string;
  text?: string;
  audioUrl?: string;
  timestamp: Timestamp | any;
};

export type Like = {
    id: string;
    likerId: string;
    likeeId: string;
    isLike: boolean;
    timestamp: Timestamp;
};
