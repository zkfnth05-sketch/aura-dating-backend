'use client';

import Header from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MatchList from '@/components/match-list';
import UserGrid from '@/components/user-grid';
import { useUser } from '@/contexts/user-context';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, getDoc, getDocs, collectionGroup, documentId, Query, Firestore, orderBy } from 'firebase/firestore';
import type { User, Like, Match, LikedBy } from '@/lib/types';
import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

// Helper function to fetch users for a list of IDs, handling the 30-item 'in' query limit.
async function fetchUsersByIds(firestore: Firestore, userIds: string[]): Promise<User[]> {
    if (userIds.length === 0) {
        return [];
    }

    const users: User[] = [];
    // Firestore 'in' query is limited to 30 items as of 2024.
    const CHUNK_SIZE = 30;

    for (let i = 0; i < userIds.length; i += CHUNK_SIZE) {
        const chunk = userIds.slice(i, i + CHUNK_SIZE);
        if (chunk.length > 0) {
            const usersQuery = query(collection(firestore, 'users'), where(documentId(), 'in', chunk));
            const userDocs = await getDocs(usersQuery);
            users.push(...userDocs.docs.map(d => d.data() as User));
        }
    }
    return users;
}


export default function MatchesPage() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  
  const [peopleWhoLikedMe, setPeopleWhoLikedMe] = useState<User[]>([]);
  const [peopleILiked, setPeopleILiked] = useState<User[]>([]);
  const [isLoadingILiked, setIsLoadingILiked] = useState(false);
  const [isLoadingWhoLikedMe, setIsLoadingWhoLikedMe] = useState(false);
  const [activeTab, setActiveTab] = useState('chats');

  // --- 1. Get matches for the "Chats" tab (real-time) ---
  const matchesQuery = useMemoFirebase(() => {
    if (!currentUser || !firestore) return null;
    return query(collection(firestore, 'matches'), where('users', 'array-contains', currentUser.id));
  }, [firestore, currentUser]);
  const { data: matches, isLoading: areMatchesLoading } = useCollection<Match>(matchesQuery);

  // --- 2. Function to fetch users who liked me ---
  const fetchWhoLikedMe = useCallback(async () => {
    if (!currentUser || !firestore) return;
    setIsLoadingWhoLikedMe(true);
    try {
        const likedMeQuery = query(collection(firestore, 'users', currentUser.id, 'likedBy'), orderBy('timestamp', 'desc'));
        const likedBySnapshot = await getDocs(likedMeQuery);
        const likerIds = likedBySnapshot.docs.map(doc => doc.data().likerId);

        if (likerIds.length === 0) {
            setPeopleWhoLikedMe([]);
        } else {
            const users = await fetchUsersByIds(firestore, likerIds);
            const orderedUsers = likerIds.map(id => users.find(u => u.id === id)).filter(Boolean) as User[];
            setPeopleWhoLikedMe(orderedUsers);
        }
    } catch (error) {
        console.error("Error fetching who liked me:", error);
        setPeopleWhoLikedMe([]);
    } finally {
        setIsLoadingWhoLikedMe(false);
    }
  }, [currentUser, firestore]);
  
  // --- 3. Function to fetch users I liked ---
  const fetchILikedData = useCallback(async () => {
    if (!currentUser || !firestore) return;
    setIsLoadingILiked(true);
    try {
      const iLikedQuery = query(
          collection(firestore, 'users', currentUser.id, 'likes'),
          where('isLike', '==', true) // Only fetch actual likes
      );
      const iLikedSnapshot = await getDocs(iLikedQuery);
      
      const sortedDocs = iLikedSnapshot.docs.sort((a, b) => {
          const timeA = a.data().timestamp?.seconds || 0;
          const timeB = b.data().timestamp?.seconds || 0;
          return timeB - timeA;
      });

      const likedUserIds = sortedDocs.map(doc => doc.data().likeeId);
      
      if (likedUserIds.length === 0) {
        setPeopleILiked([]);
      } else {
        const iLikedUsers = await fetchUsersByIds(firestore, likedUserIds);
         const orderedUsers = likedUserIds.map(id => iLikedUsers.find(u => u.id === id)).filter(Boolean) as User[];
        setPeopleILiked(orderedUsers);
      }

    } catch (error) {
      console.error("Error fetching 'I liked' data:", error);
      setPeopleILiked([]);
    } finally {
      setIsLoadingILiked(false);
    }
  }, [currentUser, firestore]);

  // --- 4. Effect to trigger fetch based on active tab ---
  useEffect(() => {
    if (activeTab === 'liked-me' && peopleWhoLikedMe.length === 0) {
        fetchWhoLikedMe();
    }
    if (activeTab === 'i-liked' && peopleILiked.length === 0) {
        fetchILikedData();
    }
  }, [activeTab, peopleWhoLikedMe.length, peopleILiked.length, fetchWhoLikedMe, fetchILikedData]);
  
  if (!currentUser || areMatchesLoading) {
    return (
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 flex justify-center items-center pt-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </main>
        </div>
    );
  }

  const renderTabContent = (tabValue: string) => {
    if (tabValue === 'chats') {
        return <MatchList matches={matches || []} />;
    }
    if (tabValue === 'liked-me') {
        return isLoadingWhoLikedMe ? <div className="flex justify-center items-center pt-20"><Loader2 className="h-8 w-8 animate-spin" /></div> : <UserGrid users={peopleWhoLikedMe} />;
    }
    if (tabValue === 'i-liked') {
        return isLoadingILiked ? <div className="flex justify-center items-center pt-20"><Loader2 className="h-8 w-8 animate-spin" /></div> : <UserGrid users={peopleILiked} />;
    }
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Tabs defaultValue="chats" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 rounded-none h-14">
            <TabsTrigger
              value="chats"
              className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-muted-foreground text-sm font-bold"
            >
              대화
            </TabsTrigger>
            <TabsTrigger
              value="liked-me"
              className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-muted-foreground text-sm font-bold"
            >
              나를 좋아요 한 사람
            </TabsTrigger>
            <TabsTrigger
              value="i-liked"
              className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-muted-foreground text-sm font-bold"
            >
              내가 좋아요 한 사람
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chats" className="mt-0 p-4">
            {renderTabContent('chats')}
          </TabsContent>
          <TabsContent value="liked-me" className="mt-0 p-4">
             {renderTabContent('liked-me')}
          </TabsContent>
          <TabsContent value="i-liked" className="mt-0 p-4">
            {renderTabContent('i-liked')}
          </TabsContent>
            
        </Tabs>
      </main>
    </div>
  );
}
