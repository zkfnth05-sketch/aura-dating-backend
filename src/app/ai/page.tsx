'use client';

import { useState, useEffect } from 'react';
import AiPageClient from '@/components/ai-page-client';
import { useUser } from '@/contexts/user-context';
import type { User } from '@/lib/types';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';

export default function AiPage() {
  const { user: currentUser, isLoaded } = useUser();
  const [recommendedUsers, setRecommendedUsers] = useState<User[]>([]);
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => {
    if (!isLoaded || !currentUser) return null;
    return query(collection(firestore, 'users'));
  }, [firestore, isLoaded, currentUser]);

  const { data: allUsers } = useCollection<User>(usersQuery);

  useEffect(() => {
    if (currentUser && allUsers) {
      const filteredUsers = allUsers.filter(user => {
          if (user.id === currentUser.id) return false; // Exclude self
          if (currentUser.gender === '남성') return user.gender === '여성';
          if (currentUser.gender === '여성') return user.gender === '남성';
          return false; 
      });
      // In a real app, the recommendation logic would be more sophisticated.
      // Here we just take the first 6.
      setRecommendedUsers(filteredUsers.slice(0, 6));
    }
  }, [currentUser, allUsers]);

  if (!currentUser) {
    return null; // Or a loading state
  }

  return <AiPageClient recommendedUsers={recommendedUsers} currentUser={currentUser} />;
}
