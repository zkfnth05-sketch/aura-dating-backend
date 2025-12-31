'use client';

import Header from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import type { User } from '@/lib/types';
import { useUser } from '@/contexts/user-context';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';


const UserCard = ({ user }: { user: User }) => {
  return (
    <Link
      href={`/users/${user.id}`}
    >
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
};

export default function HotPage() {
  const { user: currentUser, isLoaded } = useUser();
  const firestore = useFirestore();

  const [newUsers, setNewUsers] = useState<User[]>([]);
  const [hotUsers, setHotUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser || !firestore) return;
      setIsLoading(true);

      try {
        const oppositeGender = currentUser.gender === '남성' ? '여성' : '남성';
        const usersCollection = collection(firestore, 'users');

        // Fetch New Users
        const newUsersQuery = query(usersCollection, where('gender', '==', oppositeGender), orderBy('createdAt', 'desc'), limit(20));
        const newUsersSnap = await getDocs(newUsersQuery);
        const newUsersData = newUsersSnap.docs.map(d => d.data() as User).filter(u => u.id !== currentUser.id);
        setNewUsers(newUsersData);

        // Fetch Hot Users
        const hotUsersQuery = query(usersCollection, where('gender', '==', oppositeGender), limit(20));
        const hotUsersSnap = await getDocs(hotUsersQuery);
        const hotUsersData = hotUsersSnap.docs.map(d => d.data() as User).filter(u => u.id !== currentUser.id);
        setHotUsers(hotUsersData);

      } catch (error) {
        console.error("Error fetching HOT/NEW users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoaded && currentUser) {
      fetchUsers();
    }
  }, [currentUser, firestore, isLoaded]);
  

  if (!isLoaded || !currentUser) {
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
          
          <TabsContent value="new" className="mt-0 p-4">
            {isLoading ? (
              <div className="flex items-center justify-center pt-20">
                  <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                  {newUsers.map((user) => (
                      <UserCard key={`new-${user.id}`} user={user} />
                  ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="hot" className="mt-0 p-4">
            {isLoading ? (
              <div className="flex items-center justify-center pt-20">
                  <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                  {hotUsers.map((user) => (
                      <UserCard key={`hot-${user.id}`} user={user} />
                  ))}
              </div>
            )}
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}
