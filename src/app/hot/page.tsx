'use client';

import Header from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import type { User } from '@/lib/types';
import { useUser } from '@/contexts/user-context';
import { useState, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

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
  const { user: currentUser } = useUser();
  const [newUsers, setNewUsers] = useState<User[]>([]);
  const [hotUsers, setHotUsers] = useState<User[]>([]);
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => {
    if (!currentUser) return null;
    return query(collection(firestore, 'users'));
  }, [firestore, currentUser]);

  const { data: allUsers } = useCollection<User>(usersQuery);

  useEffect(() => {
    if (currentUser && allUsers) {
        const filteredMatches = allUsers.filter(user => {
            if (user.id === currentUser.id) return false;
            if (currentUser.gender === '남성') return user.gender === '여성';
            if (currentUser.gender === '여성') return user.gender === '남성';
            return false;
        });

        // For NEW, we'll sort by a timestamp if available, otherwise just use the order.
        // This assumes a `createdAt` field might exist on the user object.
        const sortedByNew = [...filteredMatches].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setNewUsers(sortedByNew.slice(0, 12));

        // For HOT, sort by likeCount.
        const sortedByLikes = [...filteredMatches].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
        setHotUsers(sortedByLikes.slice(0, 12));
    }
  }, [currentUser, allUsers]);

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
