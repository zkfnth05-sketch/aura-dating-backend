'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
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

  const lastTimestampRef = useRef<Map<string, Timestamp>>(new Map());
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
      matches.forEach(m => {
        if (m.lastMessageTimestamp) {
          lastTimestampRef.current.set(m.id, m.lastMessageTimestamp);
        }
      });
      isInitialLoad.current = false;
      return;
    }
    
    matches.forEach(match => {
      const newTimestamp = match.lastMessageTimestamp;
      const oldTimestamp = lastTimestampRef.current.get(match.id);
      const isUserInChat = pathname === `/chat/${match.id}`;
      
      const isNewer = newTimestamp && oldTimestamp ? newTimestamp.seconds > oldTimestamp.seconds : !!newTimestamp;

      if (!isUserInChat && isNewer && match.lastMessageSenderId !== currentUser.id) {
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

      if (newTimestamp) {
        lastTimestampRef.current.set(match.id, newTimestamp);
      }
    });

  }, [matches, currentUser, pathname, router, toast]);

  return null;
}
