export type User = {
  id: string;
  name: string;
  age: number;
  location: string;
  bio: string;
  hobbies: string[];
  interests: string[];
  photoUrl: string;
  photoDataUri?: string; // For AI flow
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
  text: string;
  timestamp: string;
};
