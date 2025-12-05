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
import { collection, query, orderBy, where, getDocs, limit, documentId } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

const UserCard = ({ user }: { user: User }) => (
  <Link href={`/users/${user.id}`}>
    <Card className="overflow-hidden relative group cursor-pointer border-none aspect-[3/4]">
      <Image
        src={user.photoUrls[0]}
        alt={`Profile of ${user.name}`}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        data-ai-hint="person portrait"
      />
      <div className="absolute bottom-0 left-0 right-0 p-3 text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.7)]">
        <p className="font-semibold truncate">{user.name}, {user.age}</p>
      </div>
    </Card>
  </Link>
);


export default function HotPage() {
  const { user: currentUser, isLoaded: isUserLoaded } = useUser();
  const [newUsers, setNewUsers] = useState<User[]>([]);
  const [hotUsers, setHotUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    if (!currentUser || !firestore) return;

    const fetchUsers = async () => {
      setIsLoading(true);
      
      try {
        // Fetch NEW Users - ensuring createdAt exists
        const newUsersQuery = query(
          collection(firestore, 'users'),
          where('createdAt', '!=', null),
          orderBy('createdAt', 'desc'),
          limit(12)
        );
        const newUsersSnapshot = await getDocs(newUsersQuery);
        const newUsersData = newUsersSnapshot.docs
          .map(doc => doc.data() as User)
          .filter(user => user.id !== currentUser.id);
        setNewUsers(newUsersData);

        // Fetch HOT Users - ensuring likeCount exists
        const hotUsersQuery = query(
          collection(firestore, 'users'),
          where('likeCount', '>=', 0),
          orderBy('likeCount', 'desc'),
          limit(12)
        );
        const hotUsersSnapshot = await getDocs(hotUsersQuery);
        const hotUsersData = hotUsersSnapshot.docs
          .map(doc => doc.data() as User)
          .filter(user => user.id !== currentUser.id);
        setHotUsers(hotUsersData);

      } catch (error) {
        console.error("Error fetching hot/new users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser, firestore]);

  if (!isUserLoaded) {
    return (
        <div className="flex flex-col h-screen">
            <Header />
            <main className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </main>
        </div>
      );
  }

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
          {isLoading ? (
            <div className="flex items-center justify-center pt-20">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <TabsContent value="new" className="mt-0 p-4">
                <div className="grid grid-cols-2 gap-4">
                    {newUsers.map((user) => (
                        <UserCard key={`new-${user.id}`} user={user} />
                    ))}
                </div>
              </TabsContent>
              <TabsContent value="hot" className="mt-0 p-4">
                <div className="grid grid-cols-2 gap-4">
                    {hotUsers.map((user) => (
                        <UserCard key={`hot-${user.id}`} user={user} />
                    ))}
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>
    </div>
  );
}
