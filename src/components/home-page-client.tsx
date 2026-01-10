'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { cn } from '@/lib/utils';

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

  // 리스트가 바뀌거나 현재 인덱스가 리스트 길이를 넘어서면 보정
  useEffect(() => {
    if (currentIndex >= recommendedUsers.length && recommendedUsers.length > 0) {
      setCurrentIndex(recommendedUsers.length - 1);
    } else if (recommendedUsers.length === 0) {
      setCurrentIndex(0);
    }
  }, [recommendedUsers, currentIndex]);
  

  // Prefetching Logic
  useEffect(() => {
    if (!isRecommendedUsersLoading && hasMoreRecommendedUsers && recommendedUsers.length > 0) {
        const remainingCards = recommendedUsers.length - currentIndex;
        if (remainingCards <= PREFETCH_THRESHOLD) {
             fetchNextRecommendedUsers();
        }
    }
  }, [currentIndex, recommendedUsers.length, hasMoreRecommendedUsers, isRecommendedUsersLoading, fetchNextRecommendedUsers]);

  // 현재 화면에 보여줄 "진짜" 카드 2장만 추출
  const visibleCards = useMemo(() => {
    if (isRecommendedUsersLoading && recommendedUsers.length === 0) return [];
    return recommendedUsers.slice(currentIndex, currentIndex + 2);
  }, [recommendedUsers, currentIndex, isRecommendedUsersLoading]);

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
    // touch-none: 시스템 스크롤 방지, overscroll-none: 당겨서 새로고침 방지
    <div className="fixed inset-0 flex flex-col overflow-hidden touch-none bg-background">
      <Header />
      <main className="relative flex-1 flex items-center justify-center p-4">
        <div className="relative w-full aspect-[3/4.5] max-w-[400px]">
          {(isRecommendedUsersLoading && visibleCards.length === 0) ? (
            <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : visibleCards.length > 0 ? (
            visibleCards.map((u, index) => {
              const isTop = index === 0; // slice했으므로 0번이 무조건 현재 카드
              return (
                <div
                  key={u.id}
                  className={cn(
                    "absolute inset-0 w-full h-full transition-all duration-500 ease-in-out",
                    isTop ? "z-20" : "z-10"
                  )}
                  style={{
                     // 물리적으로 하단 카드는 터치를 원천 차단
                     pointerEvents: isTop ? 'auto' : 'none',
                     // 하드웨어 가속 강제 및 위치/크기 조정
                     transform: isTop 
                       ? `translate3d(0,0,0) rotate(${swipeState === 'left' ? -15 : swipeState === 'right' ? 15 : 0}deg)`
                       : 'translate3d(0, 15px, 0) scale(0.95)',
                     opacity: isTop ? 1 : 0.6,
                     transition: 'transform 0.5s ease-out, opacity 0.5s ease-out',
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
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-card rounded-3xl shadow-sm p-6 text-center border">
              <h2 className="text-xl font-bold">주변에 새로운 인연이 없어요.</h2>
              <p className="mt-2 text-sm text-muted-foreground">필터를 변경하거나 다시 시도해주세요.</p>
              <Button onClick={initializeRecommendations} className="mt-4">새로고침</Button>
            </div>
          )}
        </div>
      </main>

      {/* 푸터를 하단에 고정 */}
      {activeUser && (
        <footer className="relative z-30 h-28 flex items-center justify-center pb-6">
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
