'use client';

import { useState, useEffect } from 'react';
import AiPageClient from '@/components/ai-page-client';
import { useUser } from '@/contexts/user-context';
import type { User } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import Header from '@/components/layout/header';

export default function AiPage() {
  const { user: currentUser, isLoaded: isUserLoaded } = useUser();
  const [recommendedUsers, setRecommendedUsers] = useState<User[]>([]);
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'));
  }, [firestore]);

  const { data: allUsers, isLoading: areUsersLoading } = useCollection<User>(usersQuery);

  useEffect(() => {
    if (currentUser && allUsers) {
      const filteredUsers = allUsers.filter(user => {
          if (user.id === currentUser.id) return false; // Exclude self
          // Basic heterosexual matching logic
          if (currentUser.gender === '남성') return user.gender === '여성';
          if (currentUser.gender === '여성') return user.gender === '남성';
          // For '기타' or other genders, you might want a different logic.
          // For now, we show everyone if the current user's gender is '기타'
          if (currentUser.gender === '기타') return true; 
          return false;
      });
      // In a real app, the recommendation logic would be more sophisticated.
      // Here we just take the first 6.
      setRecommendedUsers(filteredUsers.slice(0, 6));
    }
  }, [currentUser, allUsers]);

  if (!isUserLoaded || areUsersLoading || !currentUser) {
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
