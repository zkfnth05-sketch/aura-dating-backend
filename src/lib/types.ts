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
  photoUrl: string;
  photoUrls?: string[];
  gender?: '남성' | '여성' | '기타';
  relationship?: string[];
  values?: string[];
  communication?: string[];
  lifestyle?: string[];
  lastSeen?: 'Online' | string; // 'Online' or ISO 8601 date string
  likesMe?: boolean;
  likedByMe?: boolean;
};

export type Match = {
  id: string;
  userId: string;
  user: User;
  lastMessage: string;
  lastMessageTimestamp: string;
};

export type Message = {
  id: string;
  senderId: string;
  text?: string;
  audioUrl?: string;
  timestamp: string;
};
