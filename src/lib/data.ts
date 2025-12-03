import type { User, Match, Message } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const imageMap = new Map(PlaceHolderImages.map(img => [img.id, img.imageUrl]));

// In a real app, this would be the logged-in user.
export const currentUser: User = {
  id: 'current-user',
  name: '민준',
  age: 28,
  location: '서울, 대한민국',
  lat: 37.5665,
  lng: 126.9780,
  bio: '모험을 사랑하는 소프트웨어 엔지니어. 함께 새로운 카페나 등산로를 탐험할 분을 찾습니다.',
  hobbies: ['등산', '사진', '코딩'],
  interests: ['인디 음악', 'SF 영화', '커피'],
  gender: '남성',
  relationship: ['새로운 친구'],
  values: ['모험', '성장'],
  communication: ['진솔함', '따뜻함'],
  lifestyle: ['활동적', '탐험가'],
  photoUrl: imageMap.get('current-user')!,
  photoUrls: [
    imageMap.get('current-user')!,
    "https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=1972&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1974&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1976&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1557053910-d9eadeed1c58?q=80&w=1974&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1548142813-c348350df52b?q=80&w=1978&auto=format&fit=crop",
  ],
  lastSeen: 'Online',
};

export const potentialMatches: User[] = [
  {
    id: 'user-1',
    name: '지아',
    age: 26,
    location: '강남구, 서울',
    lat: 37.5172,
    lng: 127.0473,
    bio: '도시의 숨겨진 보석을 찾는 것을 좋아하는 미술학도. 같이 버블티 마실래요?',
    hobbies: ['그림 그리기', '독서', '요가'],
    interests: ['미술사', '다큐멘터리', 'K-Pop'],
    gender: '여성',
    relationship: ['가벼운 만남'],
    values: ['창의성', '평온함'],
    communication: ['깊은 대화', '유머러스'],
    lifestyle: ['예술가', '웰빙'],
    photoUrl: imageMap.get('user-1')!,
    photoUrls: [
        imageMap.get('user-1')!,
        "https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=1972&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1974&auto=format&fit=crop",
    ],
    lastSeen: 'Online',
    likesMe: true,
    likedByMe: false,
    likedTimestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
  },
  {
    id: 'user-2',
    name: '서준',
    age: 30,
    location: '홍대, 서울',
    lat: 37.5569,
    lng: 126.9239,
    bio: '운동과 강아지를 사랑해요. 제 골든 리트리버는 제 가장 친한 친구입니다. 아침 조깅을 함께할 파트너를 찾아요.',
    hobbies: ['달리기', '요리', '기타 연주'],
    interests: ['강아지', '액션 영화', '수제 맥주'],
    gender: '남성',
    relationship: ['진지한 관계'],
    values: ['안정', '열정'],
    communication: ['직설적', '진솔함'],
    lifestyle: ['활동적', '미니멀리스트'],
    photoUrl: imageMap.get('user-2')!,
    photoUrls: [
        imageMap.get('user-2')!,
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop",
    ],
    lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    likesMe: false,
    likedByMe: false,
  },
  {
    id: 'user-3',
    name: '하윤',
    age: 29,
    location: '이태원, 서울',
    lat: 37.5345,
    lng: 126.9942,
    bio: '여행 블로거이자 미식가. 항상 다음 여행을 계획하고 있어요. 마리오 카트는 아마 제가 이길걸요?',
    hobbies: ['여행', '블로깅', '비디오 게임'],
    interests: ['매운 음식', '90년대 R&B', '공포 영화'],
    gender: '여성',
    relationship: ['새로운 친구', '대화 상대'],
    values: ['모험', '유머'],
    communication: ['유머러스', '따뜻함'],
    lifestyle: ['탐험가', '활동적'],
    photoUrl: imageMap.get('user-3')!,
     photoUrls: [
        imageMap.get('user-3')!,
    ],
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    likesMe: false,
    likedByMe: true,
    likedTimestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
  },
  {
    id: 'user-4',
    name: '도현',
    age: 27,
    location: '성수동, 서울',
    lat: 37.5445,
    lng: 127.0560,
    bio: '음악가이자 커피 애호가. 주말엔 곡을 쓰거나 서울 최고의 라떼를 찾아다녀요.',
    hobbies: ['작곡', '커피 시음', '사이클링'],
    interests: ['라이브 음악', '철학', '미니멀리즘'],
    gender: '남성',
    relationship: ['대화 상대'],
    values: ['창의성', '진정성'],
    communication: ['깊은 대화', '진솔함'],
    lifestyle: ['예술가', '웰빙'],
    photoUrl: imageMap.get('user-4')!,
     photoUrls: [
        imageMap.get('user-4')!,
    ],
    lastSeen: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    likesMe: false,
    likedByMe: false,
  },
  {
    id: 'user-5',
    name: '서연',
    age: 25,
    location: '연남동, 서울',
    lat: 37.5619,
    lng: 126.9243,
    bio: '지속 가능성에 대한 열정을 가진 패션 디자이너. 중고 쇼핑과 옷 리폼을 좋아해요.',
    hobbies: ['재봉', '중고 쇼핑', '정원 가꾸기'],
    interests: ['지속가능한 패션', '고전 영화', '팟캐스트'],
    gender: '여성',
    relationship: ['새로운 친구'],
    values: ['성장', '안정'],
    communication: ['따뜻함', '진솔함'],
    lifestyle: ['미니멀리스트', '집순이'],
    photoUrl: imageMap.get('user-5')!,
    photoUrls: [
        imageMap.get('user-5')!,
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1976&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1557053910-d9eadeed1c58?q=80&w=1974&auto=format&fit=crop",
    ],
    lastSeen: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    likesMe: true,
    likedByMe: true,
    likedTimestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
   {
    id: 'user-6',
    name: '은우',
    age: 32,
    location: '종로구, 서울',
    lat: 37.5729,
    lng: 126.9794,
    bio: '좋은 디자인의 가치를 아는 건축가. 좋은 책과 와인 한 잔과 함께하는 조용한 밤을 즐겨요.',
    hobbies: ['독서', '스케치', '와인 시음'],
    interests: ['현대 건축', '재즈 음악', '역사'],
    gender: '남성',
    relationship: ['진지한 관계', '대화 상대'],
    values: ['안정', '평온함'],
    communication: ['깊은 대화', '직설적'],
    lifestyle: ['웰빙', '예술가'],
    photoUrl: imageMap.get('user-6')!,
    photoUrls: [
        imageMap.get('user-6')!,
    ],
    lastSeen: 'Online',
    likesMe: false,
    likedByMe: false,
  },
  {
    id: 'user-7',
    name: '지민',
    age: 28,
    location: '여의도, 서울',
    lat: 37.5213,
    lng: 126.9248,
    bio: '주말에 등산하는 것과 새로운 맛집을 탐방하는 것을 좋아해요. 유머 감각이 뛰어난 사람을 찾고 있어요.',
    hobbies: ['등산', '맛집 탐방', '콘서트'],
    interests: ['인디 음악', '코미디 쇼', '여행'],
    gender: '여성',
    relationship: ['가벼운 만남', '새로운 친구'],
    values: ['모험', '유머'],
    communication: ['유머러스', '따뜻함'],
    lifestyle: ['활동적', '탐험가'],
    photoUrl: imageMap.get('user-7')!,
    photoUrls: [
        imageMap.get('user-7')!,
    ],
    lastSeen: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    likesMe: true,
    likedByMe: false,
    likedTimestamp: new Date().toISOString(), // now
  }
];

// This is a 1x1 transparent pixel.
const placeholderDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';


export const matches: Match[] = [
  {
    id: 'match-1',
    userId: 'user-1',
    user: potentialMatches.find(u => u.id === 'user-1')!,
    lastMessage: '안녕하세요! 그리신 그림들 정말 멋져요.',
    lastMessageTimestamp: '오전 10:42',
  },
  {
    id: 'match-2',
    userId: 'user-2',
    user: potentialMatches.find(u => u.id === 'user-2')!,
    lastMessage: '강아지가 너무 귀여워요! 이름이 뭐예요?',
    lastMessageTimestamp: '어제',
  },
];

export const messages: Record<string, Message[]> = {
  'match-1': [
    { id: 'msg-1-1', senderId: 'user-1', text: '안녕하세요! 그리신 그림들 정말 멋져요.', timestamp: '오전 10:42' },
    { id: 'msg-1-2', senderId: 'current-user', text: '감사합니다! 지아님도 요가 좋아하시는군요.', timestamp: '오전 10:43' },
  ],
  'match-2': [
    { id: 'msg-2-1', senderId: 'user-2', text: '강아지가 너무 귀여워요! 이름이 뭐예요?', timestamp: '어제' },
  ],
};
