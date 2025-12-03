export type User = {
  id: string;
  name: string;
  age: number;
  location: string;
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

// This type is no longer needed as we removed the AI match analysis
// export type AIMatchEnhancementOutput = {
//   compatibilityScore: number;
//   sharedHobbies: string[];
//   sharedInterests: string[];
//   analysis: string;
//   recommendInclude: boolean;
// };
