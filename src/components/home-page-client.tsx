'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Header from '@/components/layout/header';
import ActionButtons from '@/components/action-buttons';
import ProfileCard from '@/components/profile-card';
import { useUser } from '@/contexts/user-context';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, addDoc, query, where, getDocs, limit, orderBy, startAfter, DocumentData, QueryDocumentSnapshot, Query } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/types';
import { Skeleton } from './ui/skeleton';


const PREFETCH_THRESHOLD = 5;
const FETCH_LIMIT = 10;

const CardSkeleton = () => (
    <div className="absolute inset-0 w-full h-full">
        <Skeleton className="w-full h-full rounded-2xl" />
    </div>
);


export default function HomePageClient() {
  const { 
    user: currentUser, 
    isLoaded,
    peopleILiked,
    isLikesLoading,
    filters,
  } = useUser();
  
  const router = useRouter();
  const firestore = useFirestore();

  const [recommendedUsers, setRecommendedUsers] = useState<User[]>([]);
  const [isRecommendedUsersLoading, setIsRecommendedUsersLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeState, setSwipeState] = useState<'left' | 'right' | null>(null);

  const lastVisibleRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const hasMoreRef = useRef(true);
  const isLoadingMoreRef = useRef(false);

  const fetchNextRecommendedUsers = useCallback(async (isInitial = false) => {
    if (!currentUser || peopleILiked === null || isLikesLoading) return;
    if ((isLoadingMoreRef.current || !hasMoreRef.current) && !isInitial) {
      return;
    }
    
    isLoadingMoreRef.current = true;
    
    try {
        const likedIds = new Set(peopleILiked.map(u => u.id));
        likedIds.add(currentUser.id);

        let baseQuery = collection(firestore, 'users');
        let constraints = [
          limit(20)
        ];
    
        if (filters.gender.length > 0) {
          constraints.push(where('gender', 'in', filters.gender));
        }
    
        if (!isInitial && lastVisibleRef.current) {
          constraints.push(startAfter(lastVisibleRef.current));
        }
    
        const snapshot = await getDocs(query(baseQuery, ...constraints));
        
        if (snapshot.empty) {
          hasMoreRef.current = false;
          return;
        }
    
        lastVisibleRef.current = snapshot.docs[snapshot.docs.length - 1];

        const filtered = snapshot.docs
            .map(d => d.data() as User)
            .filter(u => !likedIds.has(u.id));

        setRecommendedUsers(prev => {
            if (isInitial) return filtered;
            const existingIds = new Set(prev.map(u => u.id));
            const uniqueNewUsers = filtered.filter(u => !existingIds.has(u.id));
            return [...prev, ...uniqueNewUsers];
        });
        
    } catch (e) {
        console.error("Error fetching more recommended users:", e);
    } finally {
        isLoadingMoreRef.current = false;
        if(isInitial) {
            setIsRecommendedUsersLoading(false);
        }
    }
  }, [currentUser, peopleILiked, isLikesLoading, filters, firestore]);

  const initializeRecommendations = useCallback(() => {
    if (!isLoaded || !currentUser || peopleILiked === null) return;

    setIsRecommendedUsersLoading(true);
    setRecommendedUsers([]);
    setCurrentIndex(0);
    lastVisibleRef.current = null;
    hasMoreRef.current = true;
    
    fetchNextRecommendedUsers(true);
  }, [isLoaded, currentUser, peopleILiked, fetchNextRecommendedUsers]);

  const prevFiltersRef = useRef(JSON.stringify(filters));

  useEffect(() => {
    const currentFilters = JSON.stringify(filters);
    if (isLoaded && currentUser && peopleILiked !== null) {
      if (prevFiltersRef.current !== currentFilters) {
        prevFiltersRef.current = currentFilters;
        initializeRecommendations();
      } else if (recommendedUsers.length === 0 && hasMoreRef.current && !isLoadingMoreRef.current) {
        initializeRecommendations();
      }
    }
  }, [isLoaded, currentUser, peopleILiked, filters, initializeRecommendations, recommendedUsers.length]);

  useEffect(() => {
    if (!isRecommendedUsersLoading && hasMoreRef.current && recommendedUsers.length - currentIndex <= PREFETCH_THRESHOLD) {
      fetchNextRecommendedUsers();
    }
  }, [currentIndex, recommendedUsers.length, isRecommendedUsersLoading, fetchNextRecommendedUsers]);


  const visibleCards = useMemo(() => {
    return recommendedUsers.slice(currentIndex, currentIndex + 2);
  }, [recommendedUsers, currentIndex]);

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
  
  const isLikedByMe = peopleILiked?.some(u => u.id === activeUser?.id);
  const isReallyLoading = !isLoaded || isLikesLoading || (isRecommendedUsersLoading && recommendedUsers.length === 0);

  if (isReallyLoading) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground animate-pulse">최적의 인연을 찾는 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background overflow-hidden touch-none">
      <Header />
      <main className="relative flex-1 flex items-center justify-center p-4">
        <div className="relative w-full aspect-[3/4.5] max-w-[400px]">
          {visibleCards.length > 0 ? (
            visibleCards.map((u, index) => {
              const isTop = index === 0;
              return (
                <div
                    key={u.id}
                    className={cn(
                        "absolute inset-0 w-full h-full transition-all duration-500 ease-in-out",
                    )}
                    style={{
                        pointerEvents: isTop ? 'auto' : 'none',
                        transform: `translate3d(0, ${isTop ? 0 : 15}px, 0) scale(${isTop ? 1 : 0.95})`,
                        opacity: isTop ? 1 : 0.6,
                        zIndex: visibleCards.length - index,
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
           {isRecommendedUsersLoading && visibleCards.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <CardSkeleton />
                </div>
            )}
        </div>
      </main>

      {activeUser && (
        <footer className="relative z-30 h-28 flex items-center justify-center pb-6">
            <ActionButtons 
                onDislike={() => handleAction('dislike')}
                onMessage={() => handleAction('message')}
                onLike={() => handleAction('like')}
                isLiked={isLikedByMe}
            />
        </footer>
      )}
    </div>
  );
}
