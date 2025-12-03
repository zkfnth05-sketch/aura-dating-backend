'use client';

import Header from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { potentialMatches } from '@/lib/data';
import type { User } from '@/lib/types';

const UserCard = ({ user, uniqueKey }: { user: User, uniqueKey: string }) => (
  <Link href={`/users/${user.id}`} key={uniqueKey}>
    <Card className="overflow-hidden relative group cursor-pointer border-none aspect-[3/4]">
      <Image
        src={user.photoUrl}
        alt={`Profile of ${user.name}`}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        data-ai-hint="person portrait"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
        <p className="font-semibold truncate">{user.name}, {user.age}</p>
      </div>
    </Card>
  </Link>
);


export default function HotPage() {
  const generateUsers = (count: number, reverse: boolean = false): User[] => {
    const users: User[] = [];
    const sourceUsers = reverse ? [...potentialMatches].reverse() : potentialMatches;
    if (sourceUsers.length === 0) return [];
    for (let i = 0; i < count; i++) {
      users.push(sourceUsers[i % sourceUsers.length]);
    }
    return users;
  };
  
  const newUsers = generateUsers(12);
  const hotUsers = generateUsers(12, true);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 rounded-none h-14">
            <TabsTrigger 
              value="new" 
              className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-muted-foreground text-sm font-bold"
            >
              NEW 회원
            </TabsTrigger>
            <TabsTrigger 
              value="hot"
              className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-muted-foreground text-sm font-bold"
            >
              HOT 회원
            </TabsTrigger>
          </TabsList>
          <TabsContent value="new" className="mt-0 p-4">
            <div className="grid grid-cols-2 gap-4">
                {newUsers.map((user, index) => (
                    <UserCard key={`new-${user.id}-${index}`} user={user} uniqueKey={`new-${user.id}-${index}`} />
                ))}
            </div>
          </TabsContent>
          <TabsContent value="hot" className="mt-0 p-4">
            <div className="grid grid-cols-2 gap-4">
                {hotUsers.map((user, index) => (
                    <UserCard key={`hot-${user.id}-${index}`} user={user} uniqueKey={`hot-${user.id}-${index}`} />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
