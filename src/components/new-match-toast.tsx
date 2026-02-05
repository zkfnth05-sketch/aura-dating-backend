'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, getDoc, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import Link from 'next/link';
import type { Match, User } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';
import { usePathname } from 'next/navigation';

export function NewMatchToast() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t } = useLanguage();
  const pathname = usePathname();

  const lastSeenMatchTimestamp = useRef<Timestamp | null>(null);

  const matchesQuery = useMemoFirebase(() => {
    if (!currentUser?.id || !firestore) {
      return null;
    }
    return query(
      collection(firestore, 'matches'),
      where('users', 'array-contains', currentUser.id),
      orderBy('matchDate', 'desc'),
      limit(1)
    );
  }, [firestore, currentUser?.id]);

  const { data: recentMatches } = useCollection<Match>(matchesQuery);

  const showMatchToast = useCallback(async (match: Match) => {
    if (!currentUser || !firestore) return;
    
    // Don't show toast if user is already on the chat page for this match
    if (pathname === `/chat/${match.id}`) return;

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
  }, [currentUser, firestore, toast, t, pathname]);

  useEffect(() => {
    if (recentMatches && recentMatches.length > 0) {
      const latestMatch = recentMatches[0];
      
      // On the very first load, set the initial timestamp without showing a toast.
      if (lastSeenMatchTimestamp.current === null) {
          if (latestMatch && latestMatch.matchDate) {
              lastSeenMatchTimestamp.current = latestMatch.matchDate;
          }
          return;
      }
      
      if (latestMatch && latestMatch.matchDate && (lastSeenMatchTimestamp.current.seconds < latestMatch.matchDate.seconds)) {
        showMatchToast(latestMatch);
        lastSeenMatchTimestamp.current = latestMatch.matchDate;
      }
    }
  }, [recentMatches, showMatchToast]);

  return null;
}
