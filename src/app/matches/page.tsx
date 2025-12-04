'use client';

import Header from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MatchList from '@/components/match-list';
import UserGrid from '@/components/user-grid';
import { useUser } from '@/contexts/user-context';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { User } from '@/lib/types';

export default function MatchesPage() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();

  // Query for users who liked me
  const likesMeQuery = useMemoFirebase(() => {
    if (!currentUser) return null;
    return query(
        collection(firestore, 'likes'), 
        where('likeeId', '==', currentUser.id)
    );
  }, [firestore, currentUser]);
  const { data: likesMeData } = useCollection(likesMeQuery);

  // In a real app you'd fetch user profiles based on likerId.
  // For this demo, we'll just show a count.
  const peopleWhoLikedMe: User[] = []; // This would be populated by fetching profiles

  // Query for users I liked
  const iLikedQuery = useMemoFirebase(() => {
    if (!currentUser) return null;
    return query(
        collection(firestore, 'likes'), 
        where('likerId', '==', currentUser.id)
    );
  }, [firestore, currentUser]);
  const { data: iLikedData } = useCollection(iLikedQuery);

  // In a real app you'd fetch user profiles based on likeeId.
  const peopleILiked: User[] = []; // This would be populated by fetching profiles

  const matchesQuery = useMemoFirebase(() => {
    if (!currentUser) return null;
    return query(collection(firestore, 'matches'), where('users', 'array-contains', currentUser.id));
  }, [firestore, currentUser]);
  const { data: matches } = useCollection(matchesQuery);
  
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
          <TabsContent value="chats" className="mt-0 p-4">
            <MatchList matches={matches || []} />
          </TabsContent>
          <TabsContent value="liked-me" className="mt-0 p-4">
             {/* This is a placeholder, a real implementation would fetch user profiles based on IDs from likesMeData */}
            <UserGrid users={peopleWhoLikedMe} />
          </TabsContent>
          <TabsContent value="i-liked" className="mt-0 p-4">
              {/* This is a placeholder, a real implementation would fetch user profiles based on IDs from iLikedData */}
            <UserGrid users={peopleILiked} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
