'use client';

import { useState, useEffect } from 'react';
import AiPageClient from '@/components/ai-page-client';
import { useUser } from '@/contexts/user-context';
import type { User } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { collection, query, getDocs, limit } from 'firebase/firestore';
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
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const usersQuery = query(collection(firestore, 'users'), limit(20));
        const usersSnapshot = await getDocs(usersQuery);
        const allUsers = usersSnapshot.docs.map(doc => doc.data() as User);
        
        const filteredUsers = allUsers.filter(user => {
          if (user.id === currentUser.id) return false;
          if (currentUser.gender === '남성') return user.gender === '여성';
          if (currentUser.gender === '여성') return user.gender === '남성';
          if (currentUser.gender === '기타') return true; 
          return false;
        });

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

  if (isUserLoaded || isLoading || !currentUser) {
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
