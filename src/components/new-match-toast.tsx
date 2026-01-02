'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import Link from 'next/link';
import type { Match, User } from '@/lib/types';

export function NewMatchToast() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // Use a ref to store the set of known match IDs to prevent re-triggering toasts for existing matches on load.
  const knownMatchIds = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef(true);

  const matchesQuery = useMemoFirebase(() => {
    if (!currentUser?.id || !firestore) {
      return null;
    }
    // Query for all matches the user is a part of.
    return query(
      collection(firestore, 'matches'),
      where('users', 'array-contains', currentUser.id)
    );
  }, [firestore, currentUser]);

  const { data: matches } = useCollection<Match>(matchesQuery);

  useEffect(() => {
    if (!matches) {
      return;
    }

    if (isInitialLoad.current) {
      // On the first load, populate the set of known matches without showing toasts.
      matches.forEach(match => knownMatchIds.current.add(match.id));
      isInitialLoad.current = false;
      return;
    }

    // After the initial load, check for any new matches.
    matches.forEach(match => {
      if (!knownMatchIds.current.has(match.id)) {
        // This is a new match, show the toast.
        const otherUser = match.participants.find(p => p.id !== currentUser?.id);
        
        if (otherUser) {
          toast({
            duration: 5000,
            title: '🎉 새로운 매치!',
            description: (
              <Link href={`/users/${otherUser.id}`} className="w-full">
                <div className="flex items-center gap-3 mt-2 cursor-pointer">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={otherUser.photoUrls?.[0]} alt={otherUser.name} />
                    <AvatarFallback>{otherUser.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{otherUser.name}님과 새로운 인연이 시작되었습니다.</span>
                </div>
              </Link>
            ),
          });
        }
        
        // Add the new match ID to the set to prevent future toasts for it.
        knownMatchIds.current.add(match.id);
      }
    });
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, currentUser, toast]);

  return null;
}
