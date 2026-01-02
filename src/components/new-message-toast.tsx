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

  // Ref to track the state of unread messages to detect changes.
  const unreadCountsRef = useRef<Map<string, number>>(new Map());

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

    // Initialize or update the reference map on first load or when matches change.
    const initialLoad = unreadCountsRef.current.size === 0;
    
    matches.forEach(match => {
      const currentUnreadCount = match.unreadCounts?.[currentUser.id] || 0;
      const previousUnreadCount = unreadCountsRef.current.get(match.id) ?? 0;

      // Don't show toast if user is already in the chat room.
      const isUserInChat = pathname === `/chat/${match.id}`;

      if (!isUserInChat && !initialLoad && currentUnreadCount > previousUnreadCount) {
        // A new message has arrived.
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

      // Update the ref with the latest count.
      unreadCountsRef.current.set(match.id, currentUnreadCount);
    });

    // On first load, just populate the ref without showing toasts.
    if(initialLoad && matches.length > 0) {
        matches.forEach(m => unreadCountsRef.current.set(m.id, m.unreadCounts?.[currentUser.id] || 0))
    }

  }, [matches, currentUser, pathname, router, toast]);

  return null;
}
