'use client';

import { useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useRouter } from 'next/navigation';
import type { Match } from '@/lib/types';

export function IncomingCallToast() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast, dismiss } = useToast();
  const router = useRouter();

  const activeMatchesQuery = useMemoFirebase(() => {
    // Ensure currentUser and its id are available before creating the query
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

  useEffect(() => {
    if (ringingMatches && ringingMatches.length > 0) {
      const incomingCall = ringingMatches[0]; // Handle first incoming call
      if (incomingCall.callerId !== currentUser?.id) {
        const caller = incomingCall.participants.find(p => p.id === incomingCall.callerId);
        if (!caller) return;

        const { id: toastId } = toast({
            duration: Infinity, // Keep toast open until user interacts
            title: '영상 통화 수신',
            description: (
              <div className="flex items-center gap-3 mt-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={caller.photoUrls?.[0]} alt={caller.name} />
                  <AvatarFallback>{caller.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span>{caller.name}님이 영상 통화를 요청했습니다.</span>
              </div>
            ),
            action: (
              <div className="flex gap-2 mt-4">
                <Button variant="destructive" size="sm" onClick={async () => {
                    const matchRef = doc(firestore, 'matches', incomingCall.id);
                    await updateDoc(matchRef, { callStatus: 'idle', callerId: null });
                    dismiss(toastId);
                }}>
                  거절
                </Button>
                <Button variant="default" size="sm" onClick={async () => {
                    const matchRef = doc(firestore, 'matches', incomingCall.id);
                    await updateDoc(matchRef, { callStatus: 'active' });
                    dismiss(toastId);
                    router.push(`/chat/${incomingCall.id}`);
                }}>
                  수락
                </Button>
              </div>
            ),
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ringingMatches, currentUser, firestore, router, toast, dismiss]);

  return null; // This component does not render anything itself
}
