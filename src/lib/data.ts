import type { User, Match, Message } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const imageMap = new Map(PlaceHolderImages.map(img => [img.id, img.imageUrl]));

// In a real app, this would be the logged-in user.
export const currentUser: User = {
  id: 'current-user',
  name: 'Alex',
  age: 28,
  location: 'Seoul, South Korea',
  bio: 'Software engineer with a love for adventure. Looking for someone to explore new cafes and hiking trails with.',
  hobbies: ['Hiking', 'Photography', 'Coding'],
  interests: ['Indie Music', 'Sci-Fi Movies', 'Coffee'],
  photoUrl: imageMap.get('current-user')!,
};

export const potentialMatches: User[] = [
  {
    id: 'user-1',
    name: 'Chloe',
    age: 26,
    location: 'Seoul, South Korea',
    bio: 'Art student who loves exploring galleries and finding hidden gems in the city. Let\'s get boba!',
    hobbies: ['Painting', 'Reading', 'Yoga'],
    interests: ['Art History', 'Documentaries', 'K-Pop'],
    photoUrl: imageMap.get('user-1')!,
  },
  {
    id: 'user-2',
    name: 'Ben',
    age: 30,
    location: 'Seoul, South Korea',
    bio: 'Fitness enthusiast and dog lover. My golden retriever is my best friend. Looking for a partner in crime for morning runs.',
    hobbies: ['Running', 'Cooking', 'Playing Guitar'],
    interests: ['Dogs', 'Action Movies', 'Craft Beer'],
    photoUrl: imageMap.get('user-2')!,
  },
  {
    id: 'user-3',
    name: 'Sophia',
    age: 29,
    location: 'Seoul, South Korea',
    bio: 'Travel blogger and foodie. Always planning my next trip. I can probably beat you at Mario Kart.',
    hobbies: ['Traveling', 'Blogging', 'Video Games'],
    interests: ['Spicy Food', '90s R&B', 'Horror Movies'],
    photoUrl: imageMap.get('user-3')!,
  },
  {
    id: 'user-4',
    name: 'Daniel',
    age: 27,
    location: 'Seoul, South Korea',
    bio: 'Musician and coffee aficionado. I spend my weekends writing songs or searching for the best latte in Seoul.',
    hobbies: ['Songwriting', 'Coffee Tasting', 'Cycling'],
    interests: ['Live Music', 'Philosophy', 'Minimalism'],
    photoUrl: imageMap.get('user-4')!,
  },
  {
    id: 'user-5',
    name: 'Isabella',
    age: 25,
    location: 'Seoul, South Korea',
    bio: 'Fashion designer with a passion for sustainability. I love thrift shopping and upcycling clothes.',
    hobbies: ['Sewing', 'Thrifting', 'Gardening'],
    interests: ['Sustainable Fashion', 'Classic Films', 'Podcasts'],
    photoUrl: imageMap.get('user-5')!,
  },
   {
    id: 'user-6',
    name: 'James',
    age: 32,
    location: 'Seoul, South Korea',
    bio: 'Architect who appreciates good design. I enjoy quiet nights in with a good book and a glass of wine.',
    hobbies: ['Reading', 'Sketching', 'Wine Tasting'],
    interests: ['Modern Architecture', 'Jazz Music', 'History'],
    photoUrl: imageMap.get('user-6')!,
  },
  {
    id: 'user-7',
    name: 'Mia',
    age: 28,
    location: 'Seoul, South Korea',
    bio: 'I love hiking on the weekends and trying new restaurants. Looking for someone with a great sense of humor.',
    hobbies: ['Hiking', 'Trying new foods', 'Concerts'],
    interests: ['Indie Music', 'Comedy Shows', 'Traveling'],
    photoUrl: imageMap.get('user-7')!,
  }
];

// Add photoDataUri for AI processing. A real app would fetch this. For now, use a placeholder.
// This is a 1x1 transparent pixel.
const placeholderDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
currentUser.photoDataUri = placeholderDataUri;
potentialMatches.forEach(user => {
  user.photoDataUri = placeholderDataUri;
});


export const matches: Match[] = [
  {
    id: 'match-1',
    userId: 'user-1',
    user: potentialMatches.find(u => u.id === 'user-1')!,
    lastMessage: 'Hey! I loved your paintings.',
    lastMessageTimestamp: '10:42 AM',
  },
  {
    id: 'match-2',
    userId: 'user-2',
    user: potentialMatches.find(u => u.id === 'user-2')!,
    lastMessage: 'Your dog is so cute! What\'s his name?',
    lastMessageTimestamp: 'Yesterday',
  },
];

export const messages: Record<string, Message[]> = {
  'match-1': [
    { id: 'msg-1-1', senderId: 'user-1', text: 'Hey! I loved your paintings.', timestamp: '10:42 AM' },
    { id: 'msg-1-2', senderId: 'current-user', text: 'Thanks! I saw you like yoga, me too.', timestamp: '10:43 AM' },
  ],
  'match-2': [
    { id: 'msg-2-1', senderId: 'user-2', text: 'Your dog is so cute! What\'s his name?', timestamp: 'Yesterday' },
  ],
};
