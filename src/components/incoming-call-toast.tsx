'use client';

import { useEffect } from 'react';
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
    if (ringingMatches && ringingMatches.length > 0 && firestore) {
      const incomingCall = ringingMatches[0]; // Handle first incoming call
      if (incomingCall.callerId !== currentUser?.id) {
        
        const showCallToast = async () => {
          if (!incomingCall.callerId) return;

          const callerRef = doc(firestore, 'users', incomingCall.callerId);
          const callerSnap = await getDoc(callerRef);
          if (!callerSnap.exists()) return;

          const caller = callerSnap.data() as User;

          const { id: toastId } = toast({
              duration: Infinity, // Keep toast open until user interacts
              title: t('incoming_call_title'),
              description: (
                <div className="flex items-center gap-3 mt-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={caller.photoUrls?.[0]} alt={caller.name} />
                    <AvatarFallback>{caller.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{t('incoming_call_desc').replace('%s', caller.name)}</span>
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
        };

        showCallToast();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ringingMatches, currentUser, firestore, router, toast, dismiss, t]);

  return null; // This component does not render anything itself
}
