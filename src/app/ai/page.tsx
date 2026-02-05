'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import AiPageClient from '@/components/ai-page-client';
import { useUser } from '@/contexts/user-context';
import type { User } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { collection, query, getDocs, limit, where, startAfter, orderBy, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { Loader2, RefreshCw } from 'lucide-react';
import Header from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DateCourseForm from '@/components/date-course-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { calculateCompatibility } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';


const UserGridSkeleton = () => (
    <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="w-full aspect-[3/4] rounded-lg" />
        ))}
    </div>
);

const FETCH_POOL_SIZE = 30; // Fetch a pool of users to find the best 6
const DISPLAY_COUNT = 6;

export default function AiPage() {
  const { user: currentUser, isLoaded: isUserLoaded } = useUser();
  const [recommendedUsers, setRecommendedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const { t } = useLanguage();

  const loadRecommendations = useCallback(async () => {
      if (!currentUser || !firestore) {
        if (!isUserLoaded) return;
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        let usersQuery;
        const oppositeGender = currentUser.gender === '남성' ? '여성' : '남성';

        // Query only by creation date to avoid needing a composite index
        const baseQuery = query(
          collection(firestore, 'users'), 
          orderBy('createdAt', 'desc')
        );

        if (lastDocRef.current) {
            usersQuery = query(baseQuery, startAfter(lastDocRef.current), limit(FETCH_POOL_SIZE));
        } else {
            usersQuery = query(baseQuery, limit(FETCH_POOL_SIZE));
        }
        
        const usersSnapshot = await getDocs(usersQuery);
        
        if (usersSnapshot.empty) {
            // If we're out of users, reset and try from the beginning
            if (lastDocRef.current) {
                lastDocRef.current = null;
                // Recursive call to restart, which might cause issues, let's just show empty and let user click refresh.
                setRecommendedUsers([]);
            } else {
                setRecommendedUsers([]);
            }
            setIsLoading(false);
            return;
        }
        
        lastDocRef.current = usersSnapshot.docs[usersSnapshot.docs.length - 1];
        
        const allUsers = usersSnapshot.docs.map(doc => doc.data() as User);
        
        const filteredAndScoredUsers = allUsers
            .filter(user => {
                if (user.gender !== oppositeGender) return false; // Filter gender on client
                if (user.id === currentUser.id) return false;
                if (!user.photoUrls || user.photoUrls.length === 0) return false;
                if (currentUser.blockedUsers?.includes(user.id)) return false;
                if (user.blockedUsers?.includes(currentUser.id)) return false;
                return true;
            })
            .map(user => ({
                user,
                compatibility: calculateCompatibility(currentUser, user)
            }));
            
        // Sort by compatibility score
        filteredAndScoredUsers.sort((a, b) => b.compatibility.score - a.compatibility.score);

        setRecommendedUsers(filteredAndScoredUsers.slice(0, DISPLAY_COUNT).map(item => item.user));

      } catch (error) {
        console.error("Error fetching recommended users:", error);
        setRecommendedUsers([]);
      } finally {
        setIsLoading(false);
      }
  }, [currentUser, firestore, isUserLoaded]);

  useEffect(() => {
    if (isUserLoaded) {
      loadRecommendations();
    }
  }, [isUserLoaded, loadRecommendations]);
  
  const handleRefresh = () => {
    loadRecommendations();
  }

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
              {t('ai_rec_ideal_type_tab')}
            </TabsTrigger>
            <TabsTrigger
              value="date-course"
              className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-muted-foreground"
            >
              {t('ai_rec_date_course_tab')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="ideal-type" className="mt-6 pb-8">
            {isLoading ? (
               <UserGridSkeleton />
            ) : (
                <>
                    <AiPageClient recommendedUsers={recommendedUsers} currentUser={currentUser} />
                    <Button onClick={handleRefresh} className="w-full mt-6">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {t('show_new_recommendations_button')}
                    </Button>
                </>
            )}
            { !isLoading && recommendedUsers.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">{t('no_ai_recommendations')}</p>
                </div>
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
