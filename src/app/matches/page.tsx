'use client';

import Header from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MatchList from '@/components/match-list';
import UserGrid from '@/components/user-grid';
import { useUser } from '@/contexts/user-context';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, getDoc } from 'firebase/firestore';
import type { User, Like, Match } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

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

      // Get users who liked me
      // The 'likedBy' field on the user object holds an array of user IDs.
      const likedMeUserIds = currentUser.likedBy || [];
      if (likedMeUserIds.length > 0) {
        const userPromises = likedMeUserIds.map(id => getDoc(doc(firestore, 'users', id)));
        const userDocs = await Promise.all(userPromises);
        const usersData = userDocs.map(snap => snap.data() as User).filter(Boolean); // Filter out undefined if a doc doesn't exist
        setPeopleWhoLikedMe(usersData);
      } else {
        setPeopleWhoLikedMe([]);
      }

      // Get users I liked
      const iLikedQuery = query(collection(firestore, 'users', currentUser.id, 'likes'), where('isLike', '==', true));
      const iLikedSnapshot = await getDocs(iLikedQuery);
      const likedUserIds = iLikedSnapshot.docs.map(d => d.data().likeeId);
      
      if (likedUserIds.length > 0) {
        const userPromises = likedUserIds.map(id => getDoc(doc(firestore, 'users', id)));
        const userDocs = await Promise.all(userPromises);
        const usersData = userDocs.map(snap => snap.data() as User).filter(Boolean);
        setPeopleILiked(usersData);
      } else {
        setPeopleILiked([]);
      }

      setIsLoadingLikes(false);
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
