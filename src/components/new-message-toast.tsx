'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useRouter, usePathname } from 'next/navigation';
import type { Match } from '@/lib/types';

export function NewMessageToast() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const unreadCountsRef = useRef<Map<string, number>>(new Map());
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

  useEffect(() => {
    if (!matches || !currentUser) {
      return;
    }

    if (isInitialLoad.current) {
      matches.forEach(m => unreadCountsRef.current.set(m.id, m.unreadCounts?.[currentUser.id] || 0));
      isInitialLoad.current = false;
      return;
    }
    
    matches.forEach(match => {
      const currentUnreadCount = match.unreadCounts?.[currentUser.id] || 0;
      const previousUnreadCount = unreadCountsRef.current.get(match.id) ?? 0;

      const isUserInChat = pathname === `/chat/${match.id}`;

      if (!isUserInChat && currentUnreadCount > previousUnreadCount) {
        const sender = match.participants.find(p => p.id !== currentUser.id);

        if (sender) {
          toast({
            duration: 5000,
            title: `새 메시지: ${sender.name}`,
            description: (
              <div 
                className="w-full mt-2 cursor-pointer" 
                onClick={() => router.push(`/chat/${match.id}`)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={sender.photoUrls?.[0]} alt={sender.name} />
                    <AvatarFallback>{sender.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{match.lastMessage}</span>
                </div>
              </div>
            ),
          });
        }
      }

      unreadCountsRef.current.set(match.id, currentUnreadCount);
    });

  }, [matches, currentUser, pathname, router, toast]);

  return null;
}
