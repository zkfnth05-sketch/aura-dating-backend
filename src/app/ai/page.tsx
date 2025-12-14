'use client';

import { useState, useEffect } from 'react';
import AiPageClient from '@/components/ai-page-client';
import { useUser } from '@/contexts/user-context';
import type { User } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { collection, query, getDocs, limit, where } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import Header from '@/components/layout/header';

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
        if (currentUser.gender === '남성') {
            usersQuery = query(collection(firestore, 'users'), where('gender', '==', '여성'), limit(20));
        } else if (currentUser.gender === '여성') {
            usersQuery = query(collection(firestore, 'users'), where('gender', '==', '남성'), limit(20));
        } else {
            // For '기타' or undefined gender, fetch any gender but not the current user
            usersQuery = query(collection(firestore, 'users'), where('id', '!=', currentUser.id), limit(20));
        }

        const usersSnapshot = await getDocs(usersQuery);
        const allUsers = usersSnapshot.docs.map(doc => doc.data() as User);
        
        // Final filter to ensure current user is not in the list, although query should handle most cases
        const filteredUsers = allUsers.filter(user => user.id !== currentUser.id);

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

  if (isLoading || !isUserLoaded || !currentUser) {
    return (
        <div className="flex flex-col h-screen">
            <Header />
            <main className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </main>
        </div>
    );
  }

  return <AiPageClient recommendedUsers={recommendedUsers} currentUser={currentUser} />;
}
