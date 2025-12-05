'use client';

import Header from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MatchList from '@/components/match-list';
import UserGrid from '@/components/user-grid';
import { useUser } from '@/contexts/user-context';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, getDoc, getDocs, collectionGroup, documentId, Query, Firestore } from 'firebase/firestore';
import type { User, Like, Match } from '@/lib/types';
import { useState, useEffect } from 'react';
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
  const { user: currentUser, isLoaded: isUserLoaded } = useUser();
  const firestore = useFirestore();
  
  const [peopleWhoLikedMe, setPeopleWhoLikedMe] = useState<User[]>([]);
  const [peopleILiked, setPeopleILiked] = useState<User[]>([]);
  const [isLoadingLikes, setIsLoadingLikes] = useState(true);

  // --- 1. Get matches for the "Chats" tab ---
  const matchesQuery = useMemoFirebase(() => {
    if (!currentUser || !firestore) return null;
    return query(collection(firestore, 'matches'), where('users', 'array-contains', currentUser.id));
  }, [firestore, currentUser]);
  const { data: matches, isLoading: areMatchesLoading } = useCollection<Match>(matchesQuery);

  // --- 2. Get users who liked me and users I liked ---
  useEffect(() => {
    if (!currentUser || !firestore) return;

    const fetchLikeData = async () => {
      setIsLoadingLikes(true);
      
      try {
        // --- Get users who liked me ---
        const likedMeQuery = query(collection(firestore, 'users', currentUser.id, 'likedBy'));
        const likedMeSnapshot = await getDocs(likedMeQuery);
        const likerIds = likedMeSnapshot.docs.map(d => d.data().likerId);
        
        const likedMeUsers = await fetchUsersByIds(firestore, likerIds);
        setPeopleWhoLikedMe(likedMeUsers);
        
        // --- Get users I liked ---
        const iLikedQuery = query(collection(firestore, 'users', currentUser.id, 'likes'), where('isLike', '==', true));
        const iLikedSnapshot = await getDocs(iLikedQuery);
        const likedUserIds = iLikedSnapshot.docs.map(d => d.data().likeeId);

        const iLikedUsers = await fetchUsersByIds(firestore, likedUserIds);
        setPeopleILiked(iLikedUsers);

      } catch (error) {
        console.error("Error fetching like data:", error);
        setPeopleWhoLikedMe([]);
        setPeopleILiked([]);
      } finally {
        setIsLoadingLikes(false);
      }
    };

    fetchLikeData();

  }, [currentUser, firestore]);
  
  const isLoading = !isUserLoaded || areMatchesLoading || isLoadingLikes;
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Tabs defaultValue="chats" className="w-full">
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

          {isLoading ? (
            <div className="flex justify-center items-center pt-20">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <TabsContent value="chats" className="mt-0 p-4">
                <MatchList matches={matches || []} />
              </TabsContent>
              <TabsContent value="liked-me" className="mt-0 p-4">
                <UserGrid users={peopleWhoLikedMe} />
              </TabsContent>
              <TabsContent value="i-liked" className="mt-0 p-4">
                <UserGrid users={peopleILiked} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>
    </div>
  );
}
