'use client';

import ChatInterface from '@/components/chat-interface';
import { useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import type { Match } from '@/lib/types';
import { notFound, useParams } from 'next/navigation';
import { doc, collection, CollectionReference } from 'firebase/firestore';


export default function ChatPage() {
  const params = useParams();
  const matchId = params.matchId as string;
  const firestore = useFirestore();

  const matchRef = useMemoFirebase(() => {
    if (!matchId) return null;
    return doc(firestore, 'matches', matchId);
  }, [firestore, matchId]);
  const { data: match, isLoading: isMatchLoading } = useDoc<Match>(matchRef);

  const messagesColRef = useMemoFirebase(() => {
    if (!matchId) return null;
    return collection(firestore, 'matches', matchId, 'messages') as CollectionReference;
  }, [firestore, matchId]);

  if (isMatchLoading) {
    return <div>Loading...</div>; // Or a spinner
  }

  if (!match) {
    return notFound();
  }

  return <ChatInterface match={match} messagesColRef={messagesColRef!} />;
}
