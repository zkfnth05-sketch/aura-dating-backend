'use client';

import { useState, useEffect } from 'react';
import AiPageClient from '@/components/ai-page-client';
import { useUser } from '@/contexts/user-context';
import type { User } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { collection, query, getDocs, limit, where } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import Header from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DateCourseForm from '@/components/date-course-form';
import { Skeleton } from '@/components/ui/skeleton';

const UserGridSkeleton = () => (
    <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="w-full aspect-[3/4] rounded-lg" />
        ))}
    </div>
);


export default function AiPage() {
  const { user: currentUser, isLoaded: isUserLoaded } = useUser();
  const [recommendedUsers, setRecommendedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser || !firestore) {
        if (!isUserLoaded) {
            // still waiting for user to load
            return;
        }
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        let usersQuery;
        const oppositeGender = currentUser.gender === '남성' ? '여성' : '남성';

        usersQuery = query(
          collection(firestore, 'users'), 
          where('gender', '==', oppositeGender), 
          limit(20)
        );
        
        const usersSnapshot = await getDocs(usersQuery);
        const allUsers = usersSnapshot.docs.map(doc => doc.data() as User);
        
        // Final filter to ensure current user is not in the list, although query should handle most cases
        const filteredUsers = allUsers.filter(user => user.id !== currentUser.id && user.photoUrls && user.photoUrls.length > 0);

        setRecommendedUsers(filteredUsers.slice(0, 6));
      } catch (error) {
        console.error("Error fetching recommended users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isUserLoaded) {
      fetchUsers();
    }
  }, [currentUser, firestore, isUserLoaded]);

  if (!isUserLoaded || !currentUser) {
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
      <main className="container pt-8">
        <Tabs defaultValue="ideal-type" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 border-b border-border/40 rounded-none">
            <TabsTrigger
              value="ideal-type"
              className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-muted-foreground"
            >
              AI 추천 이상형찾기
            </TabsTrigger>
            <TabsTrigger
              value="date-course"
              className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-muted-foreground"
            >
              AI 추천 데이트 코스
            </TabsTrigger>
          </TabsList>
          <TabsContent value="ideal-type" className="mt-6 pb-8">
            {isLoading ? (
               <UserGridSkeleton />
            ) : (
              <AiPageClient recommendedUsers={recommendedUsers} currentUser={currentUser} />
            )}
          </TabsContent>
          <TabsContent value="date-course" className="mt-6 pb-8">
            <DateCourseForm />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
