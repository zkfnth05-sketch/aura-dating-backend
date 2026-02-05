'use client';
import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MatchList from '@/components/match-list';
import UserGrid from '@/components/user-grid';
import { useUser } from '@/contexts/user-context';
import { Loader2 } from 'lucide-react';
import type { User } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';

export default function MatchesPage() {
  const { user: currentUser, isLoaded, matches, isMatchesLoading, peopleILiked, peopleWhoLikedMe, isLikesLoading } = useUser();
  const { t } = useLanguage();

  const isLoading = !isLoaded || isMatchesLoading || isLikesLoading;

  // Memoize unique users to prevent re-calculation on every render
  const uniquePeopleWhoLikedMe = useMemo(() => {
    if (!peopleWhoLikedMe) return [];
    return Array.from(new Map(peopleWhoLikedMe.map(user => [user.id, user])).values());
  }, [peopleWhoLikedMe]);

  const uniquePeopleILiked = useMemo(() => {
    if (!peopleILiked) return [];
    return Array.from(new Map(peopleILiked.map(user => [user.id, user])).values());
  }, [peopleILiked]);


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
            {isLoading ? <div className="flex justify-center items-center pt-20"><Loader2 className="h-8 w-8 animate-spin" /></div> : <MatchList matches={matches || []} />}
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
