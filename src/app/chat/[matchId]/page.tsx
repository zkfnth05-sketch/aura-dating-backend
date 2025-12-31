'use client';

import ChatInterface from '@/components/chat-interface';
import { useDoc, useMemoFirebase, useFirestore, useUser } from '@/firebase';
import type { Match, User } from '@/lib/types';
import { useParams, useRouter } from 'next/navigation';
import { doc, collection, CollectionReference, updateDoc } from 'firebase/firestore';
import { Loader2, UserX, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useMemo } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;
  const firestore = useFirestore();
  const { user: currentUser } = useUser();

  const matchRef = useMemoFirebase(() => {
    if (!matchId || !firestore) return null;
    return doc(firestore, 'matches', matchId);
  }, [firestore, matchId]);
  
  const { data: match, isLoading: isMatchLoading } = useDoc<Match>(matchRef);

  const otherUserId = useMemo(() => {
      if (!match || !currentUser) return null;
      return match.users.find(id => id !== currentUser.id);
  }, [match, currentUser]);

  const otherUserRef = useMemoFirebase(() => {
    if(!otherUserId || !firestore) return null;
    return doc(firestore, 'users', otherUserId);
  }, [firestore, otherUserId]);

  const { data: otherUser, isLoading: isOtherUserLoading } = useDoc<User>(otherUserRef);

  const messagesColRef = useMemoFirebase(() => {
    if (!matchId || !firestore) return null;
    return collection(firestore, 'matches', matchId, 'messages') as CollectionReference;
  }, [firestore, matchId]);
  
  useEffect(() => {
    if (otherUser && currentUser && match) {
      // Update the other user's lastSeen timestamp in the match participants array
      const matchRef = doc(firestore, 'matches', match.id);
      const participantsUpdate = match.participants.map(p => 
        p.id === otherUser.id ? { ...p, lastSeen: new Date().toISOString() } : p
      );
      
      updateDoc(matchRef, { participants: participantsUpdate })
        .catch(e => {
            if (e.code === 'permission-denied') {
              const contextualError = new FirestorePermissionError({
                operation: 'update',
                path: matchRef.path,
                requestResourceData: { participants: participantsUpdate },
              });
              errorEmitter.emit('permission-error', contextualError);
            }
        });
    }
  }, [currentUser, otherUser, firestore, match]);

  const isLoading = isMatchLoading || !currentUser || isOtherUserLoading;

  if (isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  if (!match) {
    return (
        <div className="flex flex-col h-screen w-full items-center justify-center text-center p-4">
            <UserX className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold">대화 상대를 찾을 수 없습니다.</h1>
            <p className="text-muted-foreground mt-2">삭제되었거나 존재하지 않는 대화입니다.</p>
            <Button onClick={() => router.back()} className="mt-8">
                <ArrowLeft className="mr-2 h-4 w-4" />
                뒤로 가기
            </Button>
        </div>
    );
  }
  
  if (!otherUser) {
    return (
        <div className="flex flex-col h-screen w-full items-center justify-center text-center p-4">
            <UserX className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold">탈퇴한 회원과의 대화입니다.</h1>
            <p className="text-muted-foreground mt-2">상대방이 서비스를 탈퇴하여 더 이상 대화할 수 없습니다.</p>
            <Button onClick={() => router.back()} className="mt-8">
                <ArrowLeft className="mr-2 h-4 w-4" />
                뒤로 가기
            </Button>
        </div>
    );
  }

  return <ChatInterface match={match} messagesColRef={messagesColRef!} />;
}
