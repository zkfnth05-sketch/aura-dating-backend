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

// [최적화] 더 빨리 다음 카드를 로드하기 위해 임계값을 5로 증가
const PREFETCH_THRESHOLD = 5;

export default function HomePageClient() {
  const { 
    user: currentUser, 
    isLoaded,
    peopleILiked,
    recommendedUsers,
    isRecommendedUsersLoading,
    fetchNextRecommendedUsers,
    hasMoreRecommendedUsers,
    initializeRecommendations,
  } = useUser();
  
  const router = useRouter();
  const firestore = useFirestore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeState, setSwipeState] = useState<'left' | 'right' | null>(null);

  // Reset index when recommended list is cleared (e.g., filter change)
  useEffect(() => {
    if (currentIndex >= recommendedUsers.length && recommendedUsers.length > 0) {
      setCurrentIndex(recommendedUsers.length - 1);
    } else if (recommendedUsers.length === 0) {
      setCurrentIndex(0);
    }
  }, [recommendedUsers.length, currentIndex]);

  // Prefetching Logic (Aggressive)
  useEffect(() => {
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

    addDoc(likesCollection, likeData).catch(e => {
      if (e.code === 'permission-denied') {
        const contextualError = new FirestorePermissionError({
          operation: 'create',
          path: 'likes',
          requestResourceData: likeData,
        });
        errorEmitter.emit('permission-error', contextualError);
      } else {
        console.error("Failed to record action:", e);
      }
    });

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSwipeState(null);
    }, 500); // Animation time
  };
  
  const isLiked = peopleILiked?.some(u => u.id === activeUser?.id);

  return (
    <div className="flex flex-col h-[100dvh] bg-background overflow-hidden touch-none overscroll-none">
      <Header />
      
      <main className="flex-1 relative flex items-center justify-center p-4">
        <div className="relative w-full max-w-[380px] aspect-[3/4.5] max-h-[600px] z-10">
          {isRecommendedUsersLoading && recommendedUsers.length === 0 ? (
             <div className="flex items-center justify-center h-full w-full">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
             </div>
          ) : !activeUser ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-card rounded-3xl shadow-sm p-6 text-center border">
              <h2 className="text-xl font-bold">새로운 추천이 없어요</h2>
              <p className="text-sm text-muted-foreground mt-2">필터를 바꾸거나 잠시 후 다시 시도해주세요.</p>
              <Button onClick={initializeRecommendations} className="mt-4">다시 시도</Button>
            </div>
          ) : (
            recommendedUsers.map((u, index) => {
              if (index < currentIndex || index > currentIndex + 1) return null;

              const isTop = index === currentIndex;
              return (
                <div
                  key={u.id}
                  className="absolute inset-0 w-full h-full transform-gpu transition-all duration-300 ease-out"
                  style={{ 
                    transform: isTop ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.95)',
                    opacity: isTop ? 1 : 0.6,
                    zIndex: recommendedUsers.length - index,
                    pointerEvents: isTop ? 'auto' : 'none' 
                  }}
                >
                  <ProfileCard
                    currentUser={currentUser!}
                    potentialMatch={u}
                    isActive={isTop}
                    swipeState={isTop ? swipeState : null}
                  />
                </div>
              );
            })
          )}
        </div>
      </main>

      {activeUser && (
        <footer className="h-28 flex items-center justify-center pb-6 z-20">
          <ActionButtons 
            onDislike={() => handleAction('dislike')}
            onMessage={() => handleAction('message')}
            onLike={() => handleAction('like')}
            isLiked={isLiked}
          />
        </footer>
      )}
    </div>
  );
}
