'use client';

import Header from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MatchList from '@/components/match-list';
import UserGrid from '@/components/user-grid';
import { useUser } from '@/contexts/user-context';
import { Loader2 } from 'lucide-react';

export default function MatchesPage() {
  const { user: currentUser, isLoaded, isAppDataLoading, appData } = useUser();
  const { matches, peopleWhoLikedMe, peopleILiked } = appData;

  const isLoading = !isLoaded || isAppDataLoading;

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
