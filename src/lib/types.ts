import type { Timestamp } from 'firebase/firestore';

export type User = {
  id: string;
  name: string;
  email?: string;
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
  createdAt?: Timestamp;
  phoneNumber?: string;
  pushSubscriptions?: any[];
  blockedUsers?: string[];
};

export type Match = {
  id: string;
  users: string[];
  lastMessage: string;
  lastMessageTimestamp: Timestamp;
  lastMessageSenderId?: string;
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
    likerId: string;
    likeeId: string;
    isLike: boolean;
    timestamp: Timestamp;
};

// This type is no longer used with the new top-level 'likes' collection.
// It can be removed if no other part of the app depends on it.
export type LikedBy = {
    id: string;
    likerId: string;
    timestamp: Timestamp;
}
