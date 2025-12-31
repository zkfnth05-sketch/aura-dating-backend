'use client';
import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MatchList from '@/components/match-list';
import UserGrid from '@/components/user-grid';
import { useUser } from '@/contexts/user-context';
import { Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import type { User, Like } from '@/lib/types';

async function fetchUsersByIds(firestore: any, userIds: string[]): Promise<User[]> {
    if (userIds.length === 0) return [];
    const users: User[] = [];
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
  const { user: currentUser, isLoaded, matches, isMatchesLoading, likes, isLikesLoading } = useUser();
  const firestore = useFirestore();

  const [peopleWhoLikedMe, setPeopleWhoLikedMe] = useState<User[]>([]);
  const [peopleILiked, setPeopleILiked] = useState<User[]>([]);
  const [isLikedUsersLoading, setIsLikedUsersLoading] = useState(true);

  useEffect(() => {
    const processLikes = async () => {
        if (!likes || !currentUser || !firestore) return;
        
        setIsLikedUsersLoading(true);

        const iLikedIds = likes.filter(l => l.likerId === currentUser.id).map(l => l.likeeId);
        const likedByIds = likes.filter(l => l.likeeId === currentUser.id).map(l => l.likerId);
        
        try {
            const [iLikedUsers, likedByUsers] = await Promise.all([
                fetchUsersByIds(firestore, iLikedIds),
                fetchUsersByIds(firestore, likedByIds)
            ]);

            const orderedILiked = iLikedIds.map(id => iLikedUsers.find(u => u.id === id)).filter(Boolean) as User[];
            const orderedLikedBy = likedByIds.map(id => likedByUsers.find(u => u.id === id)).filter(Boolean) as User[];

            setPeopleILiked(orderedILiked);
            setPeopleWhoLikedMe(orderedLikedBy);
        } catch(error) {
            console.error("Error fetching liked user profiles:", error);
        } finally {
            setIsLikedUsersLoading(false);
        }
    }

    if (!isLikesLoading) {
        processLikes();
    }
  }, [likes, isLikesLoading, currentUser, firestore]);

  const isLoading = !isLoaded || isMatchesLoading || isLikedUsersLoading;

  if (!currentUser) {
    return (
        <div className="flex flex-col h-screen">
          <Header />
          <main className="flex-1 flex justify-center items-center pt-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </main>
        </div>
    );
  }
  
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
            {isLoading ? <div className="flex justify-center items-center pt-20"><Loader2 className="h-8 w-8 animate-spin" /></div> : <MatchList matches={matches || []} />}
          </TabsContent>
          <TabsContent value="liked-me" className="mt-0 p-4">
             {isLoading ? <div className="flex justify-center items-center pt-20"><Loader2 className="h-8 w-8 animate-spin" /></div> : <UserGrid users={peopleWhoLikedMe} />}
          </TabsContent>
          <TabsContent value="i-liked" className="mt-0 p-4">
            {isLoading ? <div className="flex justify-center items-center pt-20"><Loader2 className="h-8 w-8 animate-spin" /></div> : <UserGrid users={peopleILiked} />}
          </TabsContent>
            
        </Tabs>
      </main>
    </div>
  );
}
