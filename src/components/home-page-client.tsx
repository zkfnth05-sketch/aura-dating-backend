'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/layout/header';
import ActionButtons from '@/components/action-buttons';
import ProfileCard from '@/components/profile-card';
import { useUser } from '@/contexts/user-context';
import type { User } from '@/lib/types';
import type { FilterSettings } from '@/contexts/user-context';
import { useRouter } from 'next/navigation';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, updateDoc, getDoc, arrayUnion, writeBatch, increment, documentId, Query, collectionGroup, addDoc, limit } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';


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

export default function HomePageClient() {
  const { user: currentUser, filters, isLoaded } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [displayedUsers, setDisplayedUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [swipeState, setSwipeState] = useState<'left' | 'right' | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  
  useEffect(() => {
    const fetchUsers = async () => {
        if (!isLoaded || !currentUser || !firestore) return;

        setIsLoadingUsers(true);

        // 1. Get IDs of users I've already interacted with.
        const likesColRef = collection(firestore, 'users', currentUser.id, 'likes');
        const likesSnapshot = await getDocs(likesColRef);
        const seenUserIds = new Set(likesSnapshot.docs.map(doc => doc.id));
        seenUserIds.add(currentUser.id);

        // 2. Fetch a batch of potential users (e.g., 50)
        // In a real-world scenario, you'd implement more complex pagination logic.
        const usersQuery = query(collection(firestore, 'users'), limit(50));
        const allUsersSnapshot = await getDocs(usersQuery);

        // 3. Filter out users I've already seen on the client.
        const unseenUsers = allUsersSnapshot.docs
            .map(doc => doc.data() as User)
            .filter(user => !seenUserIds.has(user.id));
        
        setAllUsers(unseenUsers);
        setIsLoadingUsers(false);
    };

    fetchUsers();
  }, [isLoaded, currentUser, firestore]);

  useEffect(() => {
    if (!currentUser || allUsers.length === 0) {
        setDisplayedUsers([]);
        return;
    }
    const filtered = applyFilters(allUsers, filters, currentUser);
    setDisplayedUsers(filtered);
    setCurrentIndex(0);
  }, [allUsers, filters, currentUser]);

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
          ) : displayedUsers.length === 0 ? (
             <div className="text-center">
              <h2 className="text-2xl font-bold text-primary">추천 상대가 없어요!</h2>
              <p className="text-muted-foreground mt-2">필터 조건을 수정하거나 나중에 다시 확인해주세요.</p>
            </div>
          ) : currentIndex >= displayedUsers.length ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary">오늘은 여기까지예요!</h2>
              <p className="text-muted-foreground mt-2">새로운 상대를 보려면 나중에 다시 확인해주세요.</p>
            </div>
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
        
        {activeUser && (
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
