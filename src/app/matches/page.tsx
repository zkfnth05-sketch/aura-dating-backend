'use client';

import { useState } from 'react';
import Header from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MatchList from '@/components/match-list';
import UserGrid from '@/components/user-grid';
import { matches, potentialMatches, currentUser } from '@/lib/data';
import type { User } from '@/lib/types';

export default function MatchesPage() {
  // Mock data for likes
  const [peopleWhoLikedMe] = useState<User[]>(
    potentialMatches.filter(u => u.gender === '여성').slice(0, 4)
  );
  const [peopleILiked] = useState<User[]>(
    potentialMatches.filter(u => u.gender === '여성').slice(2, 7)
  );

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
