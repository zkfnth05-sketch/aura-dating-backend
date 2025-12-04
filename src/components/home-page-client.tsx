'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/header';
import ActionButtons from '@/components/action-buttons';
import ProfileCard from '@/components/profile-card';
import { useUser } from '@/contexts/user-context';
import type { User } from '@/lib/types';
import type { FilterSettings } from '@/contexts/user-context';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, updateDoc, getDoc, arrayUnion, writeBatch } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';


const applyFilters = (users: User[], filters: FilterSettings, currentUser: User): User[] => {
    return users.filter(user => {
      if (user.id === currentUser.id) return false;
      
      const age = Number(user.age);
      if (age < filters.ageRange.min || age > filters.ageRange.max) return false;

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
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeState, setSwipeState] = useState<'left' | 'right' | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // This query fetches ALL users. Filtering happens on the client.
  const usersQuery = useMemoFirebase(() => {
      if (!isLoaded || !currentUser) return null;
      return collection(firestore, 'users');
  }, [firestore, isLoaded, currentUser]);

  const { data: allUsers, isLoading: areUsersLoading } = useCollection<User>(usersQuery);

  useEffect(() => {
    if (isLoaded && currentUser && allUsers) {
      const getSeenUserIds = async () => {
        if (!currentUser?.id) return new Set<string>();
        const likesCol = collection(firestore, 'users', currentUser.id, 'likes');
        const likesSnapshot = await getDocs(likesCol);
        return new Set(likesSnapshot.docs.map(doc => doc.data().likeeId));
      };

      getSeenUserIds().then(seenIds => {
        const unseenUsers = allUsers.filter(user => !seenIds.has(user.id));
        const filteredUsers = applyFilters(unseenUsers, filters, currentUser);
        setUsers(filteredUsers);
        setCurrentIndex(0);
        setIsLoadingUsers(false);
      });
    }
  }, [filters, isLoaded, currentUser, allUsers, firestore]);

  const handleAction = async (action: 'like' | 'dislike' | 'message') => {
    if (!currentUser || currentIndex >= users.length) return;
    
    const targetUser = users[currentIndex];

    // For messaging, we assume a match is required.
    // This part of the logic might need to be adjusted based on whether you can message without a match.
    if (action === 'message') {
      const matchQuery = query(collection(firestore, 'matches'), where('users', 'array-contains', currentUser.id));
      const matchSnapshot = await getDocs(matchQuery);
      
      let existingMatch: {id: string} | null = null;
      matchSnapshot.forEach(doc => {
          const match = doc.data();
          if (match.users.includes(targetUser.id)) {
              existingMatch = { id: doc.id, ...match };
          }
      });
  
      let matchId: string;

      if (existingMatch) {
          matchId = existingMatch.id;
      } else {
          // You might want to prevent messaging if there is no match.
          // For now, let's create a match document.
          const newMatchRef = doc(collection(firestore, 'matches'));
          await setDoc(newMatchRef, {
              id: newMatchRef.id,
              users: [currentUser.id, targetUser.id],
              participants: [
                { id: currentUser.id, name: currentUser.name, photoUrl: currentUser.photoUrl, lastSeen: currentUser.lastSeen },
                { id: targetUser.id, name: targetUser.name, photoUrl: targetUser.photoUrl, lastSeen: targetUser.lastSeen },
              ],
              matchDate: serverTimestamp(),
              lastMessage: '새로운 대화를 시작해보세요!',
              lastMessageTimestamp: serverTimestamp(),
          });
          matchId = newMatchRef.id;
      }
      router.push(`/chat/${matchId}`);
      return;
    }

    const direction = action === 'dislike' ? 'left' : 'right';
    setSwipeState(direction);

    // --- Start Non-blocking Firestore operations ---
    const recordLike = async () => {
        if (!currentUser) return;
        const batch = writeBatch(firestore);

        // 1. Record the like/dislike in the current user's subcollection
        const likeRef = doc(collection(firestore, 'users', currentUser.id, 'likes'));
        batch.set(likeRef, {
            likerId: currentUser.id,
            likeeId: targetUser.id,
            isLike: action === 'like',
            timestamp: serverTimestamp(),
        });
    
        if (action === 'like') {
            // 2. Increment the likeCount on the target user
            const targetUserRef = doc(firestore, 'users', targetUser.id);
            // We use getDoc here to ensure we have the latest data before incrementing
            const targetUserSnap = await getDoc(targetUserRef);
            const currentLikeCount = targetUserSnap.data()?.likeCount || 0;
            batch.update(targetUserRef, {
                likeCount: currentLikeCount + 1,
                likedBy: arrayUnion(currentUser.id) // Also add to likedBy list
            });

            // 3. Check if the other user has liked us back (check their 'likes' subcollection)
             const theirLikeQuery = query(
                 collection(firestore, 'users', targetUser.id, 'likes'),
                 where('likeeId', '==', currentUser.id),
                 where('isLike', '==', true)
             );
             // This can be done in the background, but for showing an immediate match, we do it here.
             const theirLikeSnapshot = await getDocs(theirLikeQuery);


            if (!theirLikeSnapshot.empty) {
                // It's a match!
                // 4. Create a new match document
                const newMatchRef = doc(collection(firestore, 'matches'));
                batch.set(newMatchRef, {
                    id: newMatchRef.id,
                    users: [currentUser.id, targetUser.id],
                    participants: [
                        { id: currentUser.id, name: currentUser.name, photoUrl: currentUser.photoUrl, lastSeen: currentUser.lastSeen },
                        { id: targetUser.id, name: targetUser.name, photoUrl: targetUser.photoUrl, lastSeen: targetUser.lastSeen },
                    ],
                    matchDate: serverTimestamp(),
                    lastMessage: '✨ 이제 새로운 인연과 대화를 시작할 수 있어요!',
                    lastMessageTimestamp: serverTimestamp(),
                    unreadCount: 0,
                });
            }
        }
        
        // Commit all operations as a single batch
        await batch.commit();
    };

    // We don't await this promise. Let it run in the background.
    recordLike().catch(error => console.error("Failed to record like/dislike:", error));
    // --- End Non-blocking Firestore operations ---

    // Move to next card immediately
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSwipeState(null);
    }, 500);
  };
  
  if (isLoadingUsers || areUsersLoading) {
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
          ) : users.length === 0 ? (
             <div className="text-center">
              <h2 className="text-2xl font-bold text-primary">추천 상대가 없어요!</h2>
              <p className="text-muted-foreground mt-2">필터 조건을 수정하거나 나중에 다시 확인해주세요.</p>
            </div>
          ) : currentIndex >= users.length ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary">오늘은 여기까지예요!</h2>
              <p className="text-muted-foreground mt-2">새로운 상대를 보려면 나중에 다시 확인해주세요.</p>
            </div>
          ) : (
            users.map((user, index) => {
              const isActive = index === currentIndex;
              if (index < currentIndex || index > currentIndex + 2) return null; // Render current and next few cards for smoother transitions
              
              return (
                <div key={user.id} className="absolute w-full h-full" style={{ zIndex: users.length - index }}>
                  <ProfileCard
                    currentUser={currentUser}
                    potentialMatch={user}
                    isActive={isActive}
                    swipeState={isActive ? swipeState : null}
                  />
                </div>
              );
            })
          )}
        </div>
        
        {currentIndex < users.length && (
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
