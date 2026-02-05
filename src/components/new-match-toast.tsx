'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import Link from 'next/link';
import type { Match, User } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';

export function NewMatchToast() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const knownMatchIds = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef(true);

  const matchesQuery = useMemoFirebase(() => {
    if (!currentUser?.id || !firestore) {
      return null;
    }
    return query(
      collection(firestore, 'matches'),
      where('users', 'array-contains', currentUser.id)
    );
  }, [firestore, currentUser]);

  const { data: matches } = useCollection<Match>(matchesQuery);

  const showMatchToast = useCallback(async (match: Match) => {
    if (!currentUser || !firestore) return;
    const otherUserId = match.users.find(id => id !== currentUser.id);
    if (!otherUserId) return;

    try {
        const userRef = doc(firestore, 'users', otherUserId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const otherUser = userSnap.data() as User;
            toast({
                duration: 5000,
                title: t('new_match_title'),
                description: (
                  <Link href={`/chat/${match.id}`} className="w-full">
                    <div className="flex items-center gap-3 mt-2 cursor-pointer">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={otherUser.photoUrls?.[0]} alt={otherUser.name} />
                        <AvatarFallback>{otherUser.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{t('new_match_desc').replace('%s', otherUser.name)}</span>
                    </div>
                  </Link>
                ),
              });
        }
    } catch (e) {
        console.error("Failed to show match toast", e);
    }
  }, [currentUser, firestore, toast, t]);

  useEffect(() => {
    if (!matches || !currentUser) {
      return;
    }

    if (isInitialLoad.current) {
      matches.forEach(match => knownMatchIds.current.add(match.id));
      isInitialLoad.current = false;
      return;
    }

    matches.forEach(match => {
      if (!knownMatchIds.current.has(match.id)) {
        showMatchToast(match);
        knownMatchIds.current.add(match.id);
      }
    });
    
  }, [matches, currentUser, showMatchToast]);

  return null;
}
