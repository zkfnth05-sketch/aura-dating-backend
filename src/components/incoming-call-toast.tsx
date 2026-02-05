'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useRouter } from 'next/navigation';
import type { Match, User } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';

export function IncomingCallToast() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast, dismiss } = useToast();
  const router = useRouter();
  const { t } = useLanguage();

  const knownRingingIds = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef(true);

  const activeMatchesQuery = useMemoFirebase(() => {
    if (!currentUser?.id || !firestore) {
      return null;
    }
    return query(
      collection(firestore, 'matches'),
      where('users', 'array-contains', currentUser.id),
      where('callStatus', '==', 'ringing')
    );
  }, [firestore, currentUser]);

  const { data: ringingMatches } = useCollection<Match>(activeMatchesQuery);

  const showCallToast = useCallback(async (incomingCall: Match) => {
    if (!firestore || !incomingCall.callerId) return;

    try {
      const callerRef = doc(firestore, 'users', incomingCall.callerId);
      const callerSnap = await getDoc(callerRef);
      if (!callerSnap.exists()) return;

      const caller = callerSnap.data() as User;

      const notificationTitle = t('incoming_call_title');
      const notificationBody = t('incoming_call_desc').replace('%s', caller.name);
      
      // If tab is in background, use system notification
      if (document.hidden && Notification.permission === 'granted') {
          const notification = new Notification(notificationTitle, {
              body: notificationBody,
              icon: caller.photoUrls?.[0] || '/icon.svg',
              tag: `call-${incomingCall.id}`, // Tag to prevent multiple notifications for same call
          });
          
          notification.onclick = () => {
              window.focus();
              const matchRef = doc(firestore, 'matches', incomingCall.id);
              updateDoc(matchRef, { callStatus: 'active' });
              router.push(`/chat/${incomingCall.id}`);
          };
      }
      
      // Always show an in-app toast
      const { id: toastId } = toast({
          duration: 20000, // Ringing duration
          title: notificationTitle,
          description: (
            <div className="flex items-center gap-3 mt-2">
              <Avatar className="h-10 w-10"><AvatarImage src={caller.photoUrls?.[0]} alt={caller.name} /><AvatarFallback>{caller.name?.charAt(0)}</AvatarFallback></Avatar>
              <span>{notificationBody}</span>
            </div>
          ),
          action: (
            <div className="flex gap-2 mt-4">
              <Button variant="destructive" size="sm" onClick={async () => {
                  const matchRef = doc(firestore, 'matches', incomingCall.id);
                  await updateDoc(matchRef, { callStatus: 'idle', callerId: null });
                  dismiss(toastId);
              }}>
                {t('reject_call')}
              </Button>
              <Button variant="default" size="sm" onClick={async () => {
                  const matchRef = doc(firestore, 'matches', incomingCall.id);
                  await updateDoc(matchRef, { callStatus: 'active' });
                  dismiss(toastId);
                  router.push(`/chat/${incomingCall.id}`);
              }}>
                {t('accept_call')}
              </Button>
            </div>
          ),
      });
      

    } catch (error) {
        console.error("Failed to fetch caller's profile for toast:", error);
    }
  }, [firestore, toast, dismiss, router, t]);

  useEffect(() => {
    if (!ringingMatches || !currentUser) {
      return;
    }

    if (isInitialLoad.current) {
      ringingMatches.forEach(match => {
        if (match.callerId !== currentUser.id) {
          knownRingingIds.current.add(match.id);
        }
      });
      isInitialLoad.current = false;
      return;
    }

    ringingMatches.forEach(incomingCall => {
      if (incomingCall.callerId !== currentUser.id && !knownRingingIds.current.has(incomingCall.id)) {
        showCallToast(incomingCall);
        knownRingingIds.current.add(incomingCall.id);
      }
    });

    const currentRingingIds = new Set(ringingMatches.map(m => m.id));
    knownRingingIds.current.forEach(id => {
      if (!currentRingingIds.has(id)) {
        knownRingingIds.current.delete(id);
      }
    });
    
  }, [ringingMatches, currentUser, showCallToast]);

  return null;
}
