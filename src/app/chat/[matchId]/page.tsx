'use client';

import ChatInterface from '@/components/chat-interface';
import { useDoc, useMemoFirebase, useFirestore, useUser } from '@/firebase';
import type { Match, User } from '@/lib/types';
import { useParams, useRouter } from 'next/navigation';
import { doc, collection, CollectionReference } from 'firebase/firestore';
import { Loader2, UserX, ArrowLeft } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';

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

  // Find the ID of the other user from the `users` array, which is more reliable than `participants`
  const otherUserId = useMemo(() => {
    if (!match || !currentUser) return null;
    return match.users.find(id => id !== currentUser.id);
  }, [match, currentUser]);

  const otherUserRef = useMemoFirebase(() => {
    // Use the ID to create a ref for a fresh fetch of the user data
    if (!otherUserId || !firestore) return null;
    return doc(firestore, 'users', otherUserId);
  }, [firestore, otherUserId]);

  // Fetch the fresh user data using the ref
  const { data: otherUser, isLoading: isOtherUserLoading } = useDoc<User>(otherUserRef);
  
  const messagesColRef = useMemoFirebase(() => {
    if (!matchId || !firestore) return null;
    return collection(firestore, 'matches', matchId, 'messages') as CollectionReference;
  }, [firestore, matchId]);
  
  // The loading state now correctly waits for `otherUserId` to be determined
  const isLoading = isMatchLoading || !currentUser || isOtherUserLoading;


  if (isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  // This check now handles cases where the match might not exist or doesn't include the current user
  if (!match || !otherUserId) {
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
  
  // If we have an ID but the user document fetch returned no data, it means they deleted their account.
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

  return (
    <ChatInterface match={match} otherUser={otherUser} messagesColRef={messagesColRef!} />
  );
}
