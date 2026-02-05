'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Header from '@/components/layout/header';
import ActionButtons from '@/components/action-buttons';
import ProfileCard from '@/components/profile-card';
import { useUser } from '@/contexts/user-context';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, addDoc, query, where, getDocs, limit, orderBy, startAfter, DocumentData, QueryDocumentSnapshot, Query, documentId, startAt } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { useLanguage } from '@/contexts/language-context';


const PREFETCH_THRESHOLD = 5;
const FETCH_LIMIT = 20; // Fetch more to account for client-side filtering

const CardSkeleton = () => (
    <div className="absolute inset-0 w-full h-full">
        <Skeleton className="w-full h-full rounded-2xl" />
    </div>
);

function generateRandomFirestoreId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let autoId = '';
    for (let i = 0; i < 20; i++) {
      autoId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return autoId;
}


export default function HomePageClient() {
  const { 
    user: currentUser, 
    isLoaded,
    matches,
    peopleILiked,
    isLikesLoading,
    filters,
  } = useUser();
  const { t } = useLanguage();
  
  const router = useRouter();
  const firestore = useFirestore();

  const [recommendedUsers, setRecommendedUsers] = useState<User[]>([]);
  const [isRecommendedUsersLoading, setIsRecommendedUsersLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeState, setSwipeState] = useState<'left' | 'right' | null>(null);

  const lastVisibleRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const hasMoreRef = useRef(true);
  const isLoadingMoreRef = useRef(false);
  const prevFiltersRef = useRef(JSON.stringify(filters));

  const fetchNextRecommendedUsers = useCallback(async (isInitial = false) => {
    if (!firestore || !currentUser || peopleILiked === null) return;
    if ((isLoadingMoreRef.current || !hasMoreRef.current) && !isInitial) {
      return;
    }
    
    isLoadingMoreRef.current = true;
    if (isInitial) {
        setIsRecommendedUsersLoading(true);
    }
    
    try {
        const interactedUserIds = new Set(peopleILiked.map(u => u.id));
        interactedUserIds.add(currentUser.id);

        let constraints: any[] = [orderBy(documentId())];
    
        if (isInitial) {
            const randomId = generateRandomFirestoreId();
            constraints.push(startAt(randomId));
        } else if (lastVisibleRef.current) {
          constraints.push(startAfter(lastVisibleRef.current));
        }
    
        constraints.push(limit(FETCH_LIMIT));
    
        const snapshot = await getDocs(query(collection(firestore, 'users'), ...constraints));
        
        let fetchedDocs = snapshot.docs;

        // If initial random query yields nothing, we might be at the end.
        // Wrap around and query from the beginning.
        if (isInitial && snapshot.empty) {
            const wrapAroundSnapshot = await getDocs(query(collection(firestore, 'users'), orderBy(documentId()), limit(FETCH_LIMIT)));
            fetchedDocs = wrapAroundSnapshot.docs;
        }
        
        if (fetchedDocs.length === 0) {
            hasMoreRef.current = false;
        } else {
            lastVisibleRef.current = fetchedDocs[fetchedDocs.length - 1];
        }

        const genderFilter = filters.gender.length > 0 
            ? filters.gender 
            : (currentUser.gender === '남성' ? ['여성'] : ['남성']);

        const filtered = fetchedDocs
            .map(d => d.data() as User)
            .filter(u => {
                if (!genderFilter.includes(u.gender)) return false; // Client-side gender filter
                if (interactedUserIds.has(u.id)) return false;
                if (currentUser.blockedUsers?.includes(u.id)) return false;
                if (u.blockedUsers?.includes(currentUser.id)) return false;
                if (u.age < filters.ageRange.min || u.age > filters.ageRange.max) return false;
                return true;
            });

        if (filtered.length > 0) {
            setRecommendedUsers(prev => {
                if (isInitial) return filtered;
                const existingIds = new Set(prev.map(u => u.id));
                const uniqueNewUsers = filtered.filter(u => !existingIds.has(u.id));
                return [...prev, ...uniqueNewUsers];
            });
        }
        
    } catch (e) {
        console.error("Error fetching recommended users:", e);
    } finally {
        isLoadingMoreRef.current = false;
        if(isInitial) {
            setIsRecommendedUsersLoading(false);
        }
    }
  }, [currentUser, firestore, peopleILiked, filters]);

  const initializeRecommendations = useCallback(() => {
    if (!isLoaded || !currentUser || peopleILiked === null) return;

    setIsRecommendedUsersLoading(true);
    setRecommendedUsers([]);
    setCurrentIndex(0);
    lastVisibleRef.current = null;
    hasMoreRef.current = true;
    
    fetchNextRecommendedUsers(true);
  }, [isLoaded, currentUser, peopleILiked, fetchNextRecommendedUsers]);

  useEffect(() => {
    const currentFiltersJSON = JSON.stringify(filters);
    if (isLoaded && currentUser && peopleILiked !== null) {
      if (prevFiltersRef.current !== currentFiltersJSON) {
        prevFiltersRef.current = currentFiltersJSON;
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
    return recommendedUsers.slice(currentIndex, currentIndex + 2).reverse();
  }, [recommendedUsers, currentIndex]);

  const activeUser = recommendedUsers[currentIndex];

  const isAlreadyMatched = useMemo(() => {
    if (!matches || !activeUser) return null;
    return matches.find(m => m.users.includes(activeUser.id)) || null;
  }, [matches, activeUser]);


  const handleAction = async (action: 'like' | 'dislike' | 'message') => {
    if (!currentUser || !activeUser || !firestore || swipeState) return;
  
    const targetUserId = activeUser.id;
  
    if (action === 'message') {
      if (isAlreadyMatched) {
        router.push(`/chat/${isAlreadyMatched.id}`);
        return;
      }
      
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
          matchDate: serverTimestamp(),
          lastMessage: '✨ 이제 새로운 인연과 대화를 시작할 수 있어요!',
          lastMessageTimestamp: serverTimestamp(),
          lastMessageSenderId: 'system',
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
    }, 400); // Animation time
  };
  
  const isLikedByMe = peopleILiked?.some(u => u.id === activeUser?.id);
  
  const isReallyLoading = !isLoaded || isLikesLoading || (isRecommendedUsersLoading && recommendedUsers.length === 0);

  if (isReallyLoading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <Header />
      <main className="relative flex-1 flex items-center justify-center p-4">
        <div className="relative w-full aspect-[3/4.5] max-w-[400px] perspective-1000">
          {visibleCards.length > 0 ? (
            visibleCards.map((user, index) => {
              const isTop = index === 1;
              
              return (
                <ProfileCard
                  key={user.id}
                  currentUser={currentUser!}
                  potentialMatch={user}
                  isActive={isTop}
                  zIndex={isTop ? 50 : 20}
                  swipeState={isTop ? swipeState : null}
                  depth={isTop ? 0 : 1}
                />
              );
            })
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-card rounded-3xl shadow-sm p-6 text-center border">
                <h2 className="text-xl font-bold">{t('no_recommendations_title')}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t('no_recommendations_subtitle')}</p>
                <Button onClick={initializeRecommendations} className="mt-4">{t('refresh_button')}</Button>
            </div>
          )}
           {(isRecommendedUsersLoading && visibleCards.length === 0) && (
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
