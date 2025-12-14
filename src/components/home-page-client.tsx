'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/header';
import ActionButtons from '@/components/action-buttons';
import ProfileCard from '@/components/profile-card';
import { useUser } from '@/contexts/user-context';
import type { User } from '@/lib/types';
import type { FilterSettings } from '@/contexts/user-context';
import { useRouter } from 'next/navigation';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, updateDoc, getDoc, arrayUnion, writeBatch, increment, documentId, Query, collectionGroup, addDoc, limit, startAfter, DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { Loader2, RefreshCw } from 'lucide-react';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { Button } from './ui/button';


const applyFilters = (users: User[], filters: FilterSettings, currentUser: User): User[] => {
    return users.filter(user => {
      // This function assumes users are already pre-filtered by seen status and self.
      if (user.age < filters.ageRange.min || user.age > filters.ageRange.max) return false;

      if (filters.gender.length > 0 && user.gender && !filters.gender.includes(user.gender)) return false;
      
      // Default filtering by opposite gender if no specific gender is selected
      if (filters.gender.length === 0) {
        if (currentUser.gender === '남성' && user.gender !== '여성') return false;
        if (currentUser.gender === '여성' && user.gender !== '남성') return false;
      }
      
      const checkTags = (userTags: string[] = [], filterTags: string[]) => {
        if (filterTags.length === 0) return true;
        if (!userTags || userTags.length === 0) return false;
        // Check if user has ALL of the filter tags. Use .some() if you want to check for ANY.
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

const FETCH_LIMIT = 30;

export default function HomePageClient() {
  const { user: currentUser, filters, isLoaded } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [displayedUsers, setDisplayedUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [seenUserIds, setSeenUserIds] = useState<Set<string>>(new Set());

  const [swipeState, setSwipeState] = useState<'left' | 'right' | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showLoadMorePrompt, setShowLoadMorePrompt] = useState(false);
  

  const fetchUsers = useCallback(async (lastVisibleDoc: QueryDocumentSnapshot | null = null) => {
    if (!isLoaded || !currentUser || !firestore) return;

    if (lastVisibleDoc === null) {
      setIsLoadingUsers(true);
    } else {
      setIsLoadingMore(true);
    }

    // Initialize seenUserIds if it's the first fetch
    if (lastVisibleDoc === null && seenUserIds.size === 0) {
        const likesColRef = collection(firestore, 'users', currentUser.id, 'likes');
        const likesSnapshot = await getDocs(likesColRef);
        const initialSeenIds = new Set(likesSnapshot.docs.map(doc => doc.id));
        initialSeenIds.add(currentUser.id);
        setSeenUserIds(initialSeenIds);
    }

    let usersQuery = query(collection(firestore, 'users'), limit(FETCH_LIMIT));

    if (lastVisibleDoc) {
      usersQuery = query(collection(firestore, 'users'), startAfter(lastVisibleDoc), limit(FETCH_LIMIT));
    }

    const allUsersSnapshot = await getDocs(usersQuery);
    const newLastDoc = allUsersSnapshot.docs[allUsersSnapshot.docs.length - 1] || null;
    setLastDoc(newLastDoc);

    const freshUsers = allUsersSnapshot.docs
      .map(doc => doc.data() as User)
      .filter(user => !seenUserIds.has(user.id) && user.id !== currentUser.id);

    setAllUsers(prevUsers => lastVisibleDoc ? [...prevUsers, ...freshUsers] : freshUsers);
    setIsLoadingUsers(false);
    setIsLoadingMore(false);
    setShowLoadMorePrompt(false);
  }, [isLoaded, currentUser, firestore, seenUserIds]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);


  useEffect(() => {
    if (!currentUser || allUsers.length === 0) {
        setDisplayedUsers([]);
        return;
    }
    const filtered = applyFilters(allUsers, filters, currentUser);
    setDisplayedUsers(filtered);
    // Do not reset currentIndex here, as allUsers could be appended to
  }, [allUsers, filters, currentUser]);

  useEffect(() => {
    if(!isLoadingUsers && !isLoadingMore && currentIndex >= displayedUsers.length && displayedUsers.length > 0) {
        setShowLoadMorePrompt(true);
    }
  }, [currentIndex, displayedUsers, isLoadingUsers, isLoadingMore]);

  const activeUser = displayedUsers[currentIndex];

  const handleAction = async (action: 'like' | 'dislike' | 'message') => {
    if (!currentUser || !activeUser || !firestore) return;
  
    const targetUserId = activeUser.id;
  
    if (action === 'message') {
      const allMatchesQuery = query(
        collection(firestore, 'matches'),
        where('users', 'array-contains', currentUser.id)
      );
      const matchSnapshot = await getDocs(allMatchesQuery);
  
      let existingMatch: { id: string } | null = null;
      matchSnapshot.forEach(doc => {
        const match = doc.data();
        if (match.users.includes(targetUserId)) {
          existingMatch = { id: doc.id, ...match };
        }
      });
  
      if (existingMatch) {
        router.push(`/chat/${existingMatch.id}`);
      } else {
        const newMatchRef = doc(collection(firestore, 'matches'));
        const matchData = {
          id: newMatchRef.id,
          users: [currentUser.id, targetUserId],
          participants: [
            { id: currentUser.id, name: currentUser.name, photoUrls: currentUser.photoUrls, lastSeen: currentUser.lastSeen || null },
            { id: activeUser.id, name: activeUser.name, photoUrls: activeUser.photoUrls, lastSeen: activeUser.lastSeen || null },
          ],
          matchDate: serverTimestamp(),
          lastMessage: '✨ 이제 새로운 인연과 대화를 시작할 수 있어요!',
          lastMessageTimestamp: serverTimestamp(),
          unreadCounts: { [currentUser.id]: 0, [targetUserId]: 1 },
          callStatus: 'idle',
          callerId: null
        };
  
        setDoc(newMatchRef, matchData).then(() => {
          const messagesColRef = collection(newMatchRef, 'messages');
          addDoc(messagesColRef, {
            senderId: 'system',
            text: '✨ 이제 새로운 인연과 대화를 시작할 수 있어요!',
            timestamp: serverTimestamp(),
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
  
    // --- Like or Dislike action ---
    const direction = action === 'dislike' ? 'left' : 'right';
    setSwipeState(direction);
  
    const likeRef = doc(firestore, 'users', currentUser.id, 'likes', targetUserId);
    const likeData = {
      likerId: currentUser.id,
      likeeId: targetUserId,
      isLike: action === 'like',
      timestamp: serverTimestamp(),
    };
  
    setDocumentNonBlocking(likeRef, likeData);
    setSeenUserIds(prev => new Set(prev).add(targetUserId));
  
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSwipeState(null);
    }, 500);
  };
  
  if (isLoadingUsers) {
      return (
        <div className="flex flex-col h-screen bg-background">
          <Header />
          <main className="flex-grow flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </main>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-grow flex flex-col items-center p-4 overflow-hidden">
        <div className="relative w-full max-w-sm h-[70vh] max-h-[600px] flex items-center justify-center">
          {(!isLoaded || !currentUser) ? (
             <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : displayedUsers.length === 0 && !isLoadingMore ? (
             <div className="text-center">
              <h2 className="text-2xl font-bold text-primary">추천 상대가 없어요!</h2>
              <p className="text-muted-foreground mt-2">필터 조건을 수정하거나 나중에 다시 확인해주세요.</p>
            </div>
          ) : showLoadMorePrompt ? (
            <div className="text-center p-8 bg-card rounded-2xl shadow-lg">
              <h2 className="text-2xl font-bold text-primary mb-4">새로운 회원을 불러올까요?</h2>
              <p className="text-muted-foreground mb-6">계속해서 새로운 인연을 탐색해보세요.</p>
              <div className="flex justify-center gap-4">
                <Button variant="secondary" onClick={() => setShowLoadMorePrompt(false)} className="px-8 py-3 text-base">아니오</Button>
                <Button onClick={() => fetchUsers(lastDoc)} className="px-8 py-3 text-base">
                  {isLoadingMore ? <Loader2 className="h-5 w-5 animate-spin"/> : '예'}
                </Button>
              </div>
            </div>
          ) : isLoadingMore ? (
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
          ) : (
            activeUser && (
              <ProfileCard
                currentUser={currentUser}
                potentialMatch={activeUser}
                isActive={true}
                swipeState={swipeState}
                zIndex={1}
              />
            )
          )}
        </div>
        
        {activeUser && !showLoadMorePrompt && (
          <div className="absolute bottom-24 z-20">
            <ActionButtons
              onDislike={() => handleAction('dislike')}
              onMessage={() => handleAction('message')}
              onLike={() => handleAction('like')}
            />
          </div>
        )}
      </main>
    </div>
  );
}
