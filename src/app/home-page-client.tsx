'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/header';
import ActionButtons from '@/components/action-buttons';
import ProfileCard from '@/components/profile-card';
import { useUser } from '@/contexts/user-context';
import type { User } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, addDoc, Query, orderBy, limit, startAfter, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { Button } from '@/components/ui/button';

const FETCH_LIMIT = 10;

export default function HomePageClient() {
  const { user: currentUser, filters, isLoaded, peopleILiked } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const [displayedUsers, setDisplayedUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const [swipeState, setSwipeState] = useState<'left' | 'right' | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  
  const fetchUsers = useCallback(async (lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null = null) => {
    if (!isLoaded || !currentUser || !firestore || isLoadingMore) return;

    if (lastVisibleDoc === null) {
      setIsLoadingUsers(true);
    } else {
      setIsLoadingMore(true);
    }

    let usersQuery: Query<DocumentData>;
    const baseUsersRef = collection(firestore, 'users');
    
    // Base query, just order by creation time. Filtering happens on the client.
    usersQuery = query(
        baseUsersRef,
        orderBy('createdAt', 'desc')
    );

    // Add pagination
    if (lastVisibleDoc) {
      usersQuery = query(usersQuery, startAfter(lastVisibleDoc), limit(FETCH_LIMIT));
    } else {
      usersQuery = query(usersQuery, limit(FETCH_LIMIT));
    }

    try {
        const snapshot = await getDocs(usersQuery);
        
        const applyClientSideFilters = (users: User[]): User[] => {
            return users.filter(user => {
                if (user.id === currentUser.id) return false;

                // Gender Filter (client-side)
                let genderFilter: ('남성' | '여성' | '기타')[] = [];
                if (filters.gender.length > 0) {
                    genderFilter = filters.gender;
                } else if (currentUser.gender === '남성') {
                    genderFilter = ['여성'];
                } else if (currentUser.gender === '여성') {
                    genderFilter = ['남성'];
                }
                if (genderFilter.length > 0 && !genderFilter.includes(user.gender)) return false;
                
                // Other filters
                if (user.age < filters.ageRange.min || user.age > filters.ageRange.max) return false;
                
                const checkTags = (userTags: string[] = [], filterTags: string[]) => {
                    if (filterTags.length === 0) return true;
                    return filterTags.every(tag => userTags.includes(tag));
                };

                if (!checkTags(user.relationship, filters.relationship)) return false;
                if (!checkTags(user.values, filters.values)) return false;
                if (!checkTags(user.communication, filters.communication)) return false;
                if (!checkTags(user.lifestyle, filters.lifestyle)) return false;
                if (!checkTags(user.hobbies, filters.hobbies)) return false;
                if (!checkTags(user.interests, filters.interests)) return false;
                
                return true;
            });
        };

        const newUsers = snapshot.docs.map(doc => doc.data() as User);
        const filteredNewUsers = applyClientSideFilters(newUsers);

        setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMoreUsers(snapshot.docs.length === FETCH_LIMIT);
        
        setDisplayedUsers(prev => lastVisibleDoc ? [...prev, ...filteredNewUsers] : filteredNewUsers);

    } catch (e) {
        console.error("Error fetching users:", e);
    } finally {
        setIsLoadingUsers(false);
        setIsLoadingMore(false);
    }
  }, [isLoaded, currentUser, firestore, isLoadingMore, filters]);

  useEffect(() => {
    // Initial fetch
    if(isLoaded && currentUser) {
      fetchUsers(null);
    }
    // This effect should only run when filters change or user loads, not on fetchUsers change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, currentUser, filters]);


  const activeUser = displayedUsers[currentIndex];

  const handleAction = async (action: 'like' | 'dislike' | 'message') => {
    if (!currentUser || !activeUser || !firestore || swipeState) return;
  
    const targetUserId = activeUser.id;
  
    if (action === 'message') {
      // Find if a match already exists
      const matchQuery = query(
        collection(firestore, 'matches'),
        where('users', 'in', [[currentUser.id, targetUserId], [targetUserId, currentUser.id]])
      );

      const matchSnapshot = await getDocs(matchQuery);
      const existingMatchDoc = matchSnapshot.docs[0];

      if (existingMatchDoc) {
        router.push(`/chat/${existingMatchDoc.id}`);
      } else {
        // Create a new match if it doesn't exist
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

    // Non-blocking write to the new top-level 'likes' collection
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

    setTimeout(() => {
      if (currentIndex === displayedUsers.length - 1 && hasMoreUsers) {
        fetchUsers(lastDoc);
      }
      setCurrentIndex(prev => prev + 1);
      setSwipeState(null);
    }, 500);
  };
  
  if (isLoadingUsers) {
      return (
        <div className="flex flex-col h-screen bg-background">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </main>
        </div>
      );
  }
  
  const hasLiked = peopleILiked?.some(u => u.id === activeUser?.id);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Header />
      <main className="flex-1 flex flex-col items-center pt-4">
        <div className="relative w-full max-w-sm h-[70vh] max-h-[600px] flex items-center justify-center">
            {(!isLoaded || !currentUser) ? (
                <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : !activeUser ? (
                <div className="text-center p-8 bg-card rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold text-primary">추천 상대가 없어요!</h2>
                <p className="text-muted-foreground mt-2">필터 조건을 수정하거나 나중에 다시 확인해주세요.</p>
                <Button onClick={() => fetchUsers()} className="mt-6">
                    다시 시도
                </Button>
                </div>
            ) : (
                <>
                {displayedUsers.map((user, index) => {
                    if (index < currentIndex) return null;
                    const isTop = index === currentIndex;
                    return (
                        <ProfileCard
                            key={user.id}
                            currentUser={currentUser}
                            potentialMatch={user}
                            isActive={isTop}
                            swipeState={isTop ? swipeState : null}
                            zIndex={displayedUsers.length - index}
                        />
                    )
                })}
                {(isLoadingMore) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl z-50">
                        <Loader2 className="h-12 w-12 animate-spin text-white" />
                    </div>
                )}
                </>
            )}
        </div>
      </main>

      {activeUser && (
        <footer className="fixed bottom-24 left-0 right-0 z-20">
            <div className="flex justify-center">
                <ActionButtons 
                    onDislike={() => handleAction('dislike')}
                    onMessage={() => handleAction('message')}
                    onLike={() => handleAction('like')}
                    showLike={!hasLiked}
                />
            </div>
        </footer>
      )}
    </div>
  );
}
