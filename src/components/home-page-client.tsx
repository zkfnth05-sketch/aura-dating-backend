'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/header';
import ActionButtons from '@/components/action-buttons';
import ProfileCard from '@/components/profile-card';
import { useUser } from '@/contexts/user-context';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, addDoc, query, where, getDocs } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { Button } from '@/components/ui/button';

const PREFETCH_THRESHOLD = 3;

export default function HomePageClient() {
  const { 
    user: currentUser, 
    isLoaded,
    peopleILiked,
    recommendedUsers,
    isRecommendedUsersLoading,
    fetchNextRecommendedUsers,
    hasMoreRecommendedUsers,
  } = useUser();
  
  const router = useRouter();
  const firestore = useFirestore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeState, setSwipeState] = useState<'left' | 'right' | null>(null);

  // Reset index when recommended list is cleared (e.g., filter change)
  useEffect(() => {
    if (recommendedUsers.length === 0) {
        setCurrentIndex(0);
    }
  }, [recommendedUsers.length]);

  // Prefetching Logic
  useEffect(() => {
    // Only prefetch if we have data, more data exists, and we aren't already loading
    if (!isRecommendedUsersLoading && hasMoreRecommendedUsers && recommendedUsers.length > 0) {
        const remainingCards = recommendedUsers.length - currentIndex;
        if (remainingCards <= PREFETCH_THRESHOLD) {
             fetchNextRecommendedUsers();
        }
    }
  }, [currentIndex, recommendedUsers.length, hasMoreRecommendedUsers, isRecommendedUsersLoading, fetchNextRecommendedUsers]);

  const activeUser = recommendedUsers[currentIndex];

  const handleAction = async (action: 'like' | 'dislike' | 'message') => {
    if (!currentUser || !activeUser || !firestore || swipeState) return;
  
    const targetUserId = activeUser.id;
  
    if (action === 'message') {
      const matchQuery = query(
        collection(firestore, 'matches'),
        where('users', 'in', [[currentUser.id, targetUserId], [targetUserId, currentUser.id]])
      );

      const matchSnapshot = await getDocs(matchQuery);
      const existingMatchDoc = matchSnapshot.docs[0];

      if (existingMatchDoc) {
        router.push(`/chat/${existingMatchDoc.id}`);
      } else {
        const newMatchRef = doc(collection(firestore, 'matches'));
        const matchData = {
          id: newMatchRef.id,
          users: [currentUser.id, targetUserId],
          participants: [currentUser, activeUser],
          matchDate: serverTimestamp(),
          lastMessage: '✨ 이제 새로운 인연과 대화를 시작할 수 있어요!',
          lastMessageTimestamp: serverTimestamp(),
          unreadCounts: { [currentUser.id]: 0, [targetUserId]: 1 },
          callStatus: 'idle' as const,
          callerId: null,
        };
  
        setDoc(newMatchRef, matchData).then(() => {
          const messagesColRef = collection(newMatchRef, 'messages');
          addDoc(messagesColRef, {
            senderId: 'system',
            text: '✨ 이제 새로운 인연과 대화를 시작할 수 있어요!',
            timestamp: serverTimestamp(),
          }).catch(e => {
            if (e.code === 'permission-denied') {
              const contextualError = new FirestorePermissionError({
                operation: 'create',
                path: `matches/${newMatchRef.id}/messages`,
                requestResourceData: { senderId: 'system', text: '...'},
              });
              errorEmitter.emit('permission-error', contextualError);
            }
          });
          router.push(`/chat/${newMatchRef.id}`);
        }).catch(e => {
          if (e.code === 'permission-denied') {
            const contextualError = new FirestorePermissionError({
              operation: 'create',
              path: `matches/${newMatchRef.id}`,
              requestResourceData: matchData,
            });
            errorEmitter.emit('permission-error', contextualError);
          } else {
            console.error("Failed to create match:", e);
          }
        });
      }
      return;
    }
  
    const direction = action === 'dislike' ? 'left' : 'right';
    setSwipeState(direction);
  
    const likeData = {
      likerId: currentUser.id,
      likeeId: targetUserId,
      isLike: action === 'like',
      timestamp: serverTimestamp(),
    };

    const likesCollection = collection(firestore, 'likes');

    // Add like document
    if (action === 'like') {
      addDoc(likesCollection, likeData).catch(e => {
        if (e.code === 'permission-denied') {
          const contextualError = new FirestorePermissionError({
            operation: 'create',
            path: 'likes',
            requestResourceData: likeData,
          });
          errorEmitter.emit('permission-error', contextualError);
        } else {
          console.error("Failed to record like:", e);
        }
      });
    }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSwipeState(null);
    }, 500);
  };
  
  // Show full screen loader only if we have NO data and are loading the first batch
  if (!isLoaded || (isRecommendedUsersLoading && recommendedUsers.length === 0)) {
      return (
        <div className="flex flex-col h-screen bg-background">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </main>
        </div>
      );
  }

  const isLiked = peopleILiked?.some(u => u.id === activeUser?.id);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Header />
      <main className="flex-1 flex flex-col items-center pt-4">
        <div className="relative w-full max-w-sm h-[70vh] max-h-[600px] flex items-center justify-center">
            {!currentUser ? (
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : !activeUser ? (
                <div className="text-center p-8 bg-card rounded-2xl shadow-lg">
                  <h2 className="text-2xl font-bold text-primary">추천 상대가 없어요!</h2>
                  <p className="text-muted-foreground mt-2">필터 조건을 수정하거나 나중에 다시 확인해주세요.</p>
                  <Button onClick={() => window.location.reload()} className="mt-6">
                      다시 시도
                  </Button>
                </div>
            ) : (
                <>
                  {recommendedUsers.map((user, index) => {
                      if (index < currentIndex) return null;
                      const isTop = index === currentIndex;
                      return (
                          <ProfileCard
                              key={user.id}
                              currentUser={currentUser}
                              potentialMatch={user}
                              isActive={isTop}
                              swipeState={isTop ? swipeState : null}
                              zIndex={recommendedUsers.length - index}
                          />
                      )
                  })}
                </>
            )}
        </div>
      </main>

      {activeUser && (
        <footer className="fixed bottom-24 left-0 right-0 z-50">
            <div className="flex justify-center">
                <ActionButtons 
                    onDislike={() => handleAction('dislike')}
                    onMessage={() => handleAction('message')}
                    onLike={() => handleAction('like')}
                    isLiked={isLiked}
                />
            </div>
        </footer>
      )}
    </div>
  );
}
