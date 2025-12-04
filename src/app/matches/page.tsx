'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MatchList from '@/components/match-list';
import UserGrid from '@/components/user-grid';
import { matches, potentialMatches } from '@/lib/data';
import type { User } from '@/lib/types';
import { useUser } from '@/contexts/user-context';

export default function MatchesPage() {
  const { user: currentUser } = useUser();

  const [peopleWhoLikedMe, setPeopleWhoLikedMe] = useState<User[]>([]);
  const [peopleILiked, setPeopleILiked] = useState<User[]>([]);

  useEffect(() => {
    const sortUsersByTimestamp = (a: User, b: User) => {
      const dateA = a.likedTimestamp ? new Date(a.likedTimestamp).getTime() : 0;
      const dateB = b.likedTimestamp ? new Date(b.likedTimestamp).getTime() : 0;
      return dateB - dateA;
    };
    
    // Correctly filter users who like the current user
    setPeopleWhoLikedMe(potentialMatches.filter(u => u.likesMe).sort(sortUsersByTimestamp));

    // Correctly filter users who the current user has liked
    setPeopleILiked(potentialMatches.filter(u => u.likedByMe).sort(sortUsersByTimestamp));
    
  }, [currentUser.gender]);

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
            <MatchList matches={matches} />
          </TabsContent>
          <TabsContent value="liked-me" className="mt-0 p-4">
            <UserGrid users={peopleWhoLikedMe} />
          </TabsContent>
          <TabsContent value="i-liked" className="mt-0 p-4">
            <UserGrid users={peopleILiked} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
