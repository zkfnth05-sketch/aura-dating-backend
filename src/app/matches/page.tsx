'use client';
import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MatchList from '@/components/match-list';
import UserGrid from '@/components/user-grid';
import { useUser } from '@/contexts/user-context';
import { useFirestore } from '@/firebase'; // Import useFirestore
import { Loader2 } from 'lucide-react';
import type { User, Match } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';
import { collection, query, where, documentId, getDocs } from 'firebase/firestore'; // Import firestore functions

// This function can be moved to a utils file, but for now it's here.
async function fetchUsersByIds(firestore: any, userIds: string[]): Promise<User[]> {
  if (!userIds || userIds.length === 0) return [];
  const users: User[] = [];
  // Firestore 'in' query limit is 30
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

export interface MatchWithUser {
  match: Match;
  otherUser?: User;
}

export default function MatchesPage() {
  const { user: currentUser, isLoaded, matches, isMatchesLoading, peopleILiked, peopleWhoLikedMe, isLikesLoading } = useUser();
  const { t } = useLanguage();
  const firestore = useFirestore();
  const [otherUsersForMatches, setOtherUsersForMatches] = useState<User[]>([]);
  const [areOtherUsersLoading, setAreOtherUsersLoading] = useState(true);

  const isLoading = !isLoaded || isMatchesLoading || isLikesLoading || areOtherUsersLoading;

  const otherUserIdsForMatches = useMemo(() => {
    if (!matches || !currentUser) return [];
    return matches.map(m => m.users.find(id => id !== currentUser.id)).filter((id): id is string => !!id);
  }, [matches, currentUser]);

  useEffect(() => {
    if (!firestore || otherUserIdsForMatches.length === 0) {
        setAreOtherUsersLoading(false);
        return;
    }
    
    setAreOtherUsersLoading(true);
    fetchUsersByIds(firestore, otherUserIdsForMatches)
      .then(users => {
        setOtherUsersForMatches(users);
      })
      .catch(console.error)
      .finally(() => {
        setAreOtherUsersLoading(false);
      });
  }, [firestore, otherUserIdsForMatches]);
  
  const matchesWithUsers: MatchWithUser[] = useMemo(() => {
    if (!matches || !currentUser) return [];
    const usersById = new Map(otherUsersForMatches.map(u => [u.id, u]));
    return matches
      .map(match => {
        const otherUserId = match.users.find(id => id !== currentUser.id);
        const otherUser = otherUserId ? usersById.get(otherUserId) : undefined;
        return { match, otherUser };
      })
      .filter(item => item.otherUser); // Filter out matches where other user was not found (e.g., deleted account)
  }, [matches, currentUser, otherUsersForMatches]);

  // Memoize unique users to prevent re-calculation on every render
  const uniquePeopleWhoLikedMe = useMemo(() => {
    if (!peopleWhoLikedMe) return [];
    return Array.from(new Map(peopleWhoLikedMe.map(user => [user.id, user])).values());
  }, [peopleWhoLikedMe]);

  const uniquePeopleILiked = useMemo(() => {
    if (!peopleILiked) return [];
    return Array.from(new Map(peopleILiked.map(user => [user.id, user])).values());
  }, [peopleILiked]);


  if (!isLoaded || !currentUser) {
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
      <main>
        <Tabs defaultValue="chats" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 rounded-none h-14">
            <TabsTrigger
              value="chats"
              className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-muted-foreground text-sm font-bold"
            >
              {t('chats_tab')}
            </TabsTrigger>
            <TabsTrigger
              value="liked-me"
              className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-muted-foreground text-sm font-bold"
            >
              {t('liked_me_tab')}
            </TabsTrigger>
            <TabsTrigger
              value="i-liked"
              className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-muted-foreground text-sm font-bold"
            >
              {t('i_liked_tab')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chats" className="mt-0 p-4 pb-4">
            {isLoading ? <div className="flex justify-center items-center pt-20"><Loader2 className="h-8 w-8 animate-spin" /></div> : <MatchList matchesWithUsers={matchesWithUsers} />}
          </TabsContent>
          <TabsContent value="liked-me" className="mt-0 p-4 pb-4">
             {isLoading ? <div className="flex justify-center items-center pt-20"><Loader2 className="h-8 w-8 animate-spin" /></div> : <UserGrid users={uniquePeopleWhoLikedMe} />}
          </TabsContent>
          <TabsContent value="i-liked" className="mt-0 p-4 pb-4">
            {isLoading ? <div className="flex justify-center items-center pt-20"><Loader2 className="h-8 w-8 animate-spin" /></div> : <UserGrid users={uniquePeopleILiked} />}
          </TabsContent>
            
        </Tabs>
      </main>
    </div>
  );
}
