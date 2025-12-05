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
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, updateDoc, getDoc, arrayUnion, writeBatch, increment, documentId, Query } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';


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
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeState, setSwipeState] = useState<'left' | 'right' | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  
  useEffect(() => {
    const fetchAndFilterUsers = async () => {
        if (!isLoaded || !currentUser || !firestore) return;

        setIsLoadingUsers(true);

        const likesColRef = collection(firestore, 'users', currentUser.id, 'likes');
        const likesSnapshot = await getDocs(likesColRef);
        const seenUserIds = new Set(likesSnapshot.docs.map(doc => doc.data().likeeId));
        seenUserIds.add(currentUser.id);
        
        let unseenUserIds: string[] = [];
        const allUsersSnapshot = await getDocs(collection(firestore, 'users'));
        allUsersSnapshot.forEach(doc => {
            if (!seenUserIds.has(doc.id)) {
                unseenUserIds.push(doc.id);
            }
        });
        
        let filteredUsers: User[] = [];
        if(unseenUserIds.length > 0) {
            // Firestore 'in' query has a limit of 30 items
            const CHUNK_SIZE = 30;
            let unseenUsers: User[] = [];
            for (let i = 0; i < unseenUserIds.length; i += CHUNK_SIZE) {
                const chunk = unseenUserIds.slice(i, i + CHUNK_SIZE);
                const usersQuery = query(collection(firestore, 'users'), where(documentId(), 'in', chunk));
                const userDocs = await getDocs(usersQuery);
                unseenUsers.push(...userDocs.docs.map(d => d.data() as User));
            }
            filteredUsers = applyFilters(unseenUsers, filters, currentUser);
        }
        
        setUsers(filteredUsers);
        setCurrentIndex(0);
        setIsLoadingUsers(false);
    };

    fetchAndFilterUsers();
  }, [filters, isLoaded, currentUser, firestore]);
  
  const activeUser = users[currentIndex];

  const handleAction = async (action: 'like' | 'dislike' | 'message') => {
    if (!currentUser || !activeUser) return;
    
    const targetUserId = activeUser.id;

    if (!targetUserId) {
        toast({
          variant: "destructive",
          title: "오류",
          description: "사용자 정보를 찾을 수 없습니다."
        });
        return;
    }
    
    // For messaging, we assume a match is required.
    if (action === 'message') {
      const matchQuery = query(collection(firestore, 'matches'), where('users', 'array-contains', currentUser.id));
      const matchSnapshot = await getDocs(matchQuery);
      
      let existingMatch: {id: string} | null = null;
      matchSnapshot.forEach(doc => {
          const match = doc.data();
          if (match.users.includes(targetUserId)) {
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
          const targetUser = activeUser;
          await setDoc(newMatchRef, {
              id: newMatchRef.id,
              users: [currentUser.id, targetUserId],
              participants: [
                { id: currentUser.id, name: currentUser.name, photoUrls: currentUser.photoUrls, lastSeen: currentUser.lastSeen },
                { id: targetUser.id, name: targetUser.name, photoUrls: targetUser.photoUrls, lastSeen: targetUser.lastSeen },
              ],
              matchDate: serverTimestamp(),
              lastMessage: '새로운 대화를 시작해보세요!',
              lastMessageTimestamp: serverTimestamp(),
              unreadCounts: { [currentUser.id]: 0, [targetUserId]: 0 },
              callStatus: 'idle',
              callerId: null
          });
          matchId = newMatchRef.id;
      }
      router.push(`/chat/${matchId}`);
      return;
    }

    const direction = action === 'dislike' ? 'left' : 'right';
    setSwipeState(direction);

    // --- Non-blocking Firestore operations ---
    const recordLike = async (userId: string, likeeId: string) => {
        const batch = writeBatch(firestore);
        
        const likeData = {
            id: '', // Will be overridden by doc ref id
            likerId: userId,
            likeeId: likeeId,
            isLike: action === 'like',
            timestamp: serverTimestamp(),
        };

        const likeRef = doc(collection(firestore, 'users', userId, 'likes'));
        likeData.id = likeRef.id;
        batch.set(likeRef, likeData);
    
        if (action === 'like') {
            const targetUserRef = doc(firestore, 'users', likeeId);
            batch.update(targetUserRef, { likeCount: increment(1) });
            
            const likedByRef = doc(collection(firestore, 'users', likeeId, 'likedBy'));
            batch.set(likedByRef, {
                likerId: userId,
                timestamp: serverTimestamp(),
            });

             const theirLikeQuery = query(
                 collection(firestore, 'users', likeeId, 'likes'),
                 where('likeeId', '==', userId),
                 where('isLike', '==', true)
             );
             const theirLikeSnapshot = await getDocs(theirLikeQuery);

            if (!theirLikeSnapshot.empty) {
                const newMatchRef = doc(collection(firestore, 'matches'));
                const targetUser = activeUser;
                batch.set(newMatchRef, {
                    id: newMatchRef.id,
                    users: [userId, likeeId],
                    participants: [
                        { id: userId, name: currentUser.name, photoUrls: currentUser.photoUrls, lastSeen: currentUser.lastSeen },
                        { id: likeeId, name: targetUser.name, photoUrls: targetUser.photoUrls, lastSeen: targetUser.lastSeen },
                    ],
                    matchDate: serverTimestamp(),
                    lastMessage: '✨ 이제 새로운 인연과 대화를 시작할 수 있어요!',
                    lastMessageTimestamp: serverTimestamp(),
                    unreadCounts: { [userId]: 0, [likeeId]: 0 },
                    callStatus: 'idle',
                    callerId: null
                });
            }
        }
        
        try {
          await batch.commit();
        } catch(e: any) {
          const isPermissionError = e.code === 'permission-denied';

          if (isPermissionError) {
              const contextualError = new FirestorePermissionError({
                  operation: 'write',
                  path: `users/${userId}/likes`,
                  requestResourceData: { likeeId: likeeId, isLike: action === 'like' }
              });
              errorEmitter.emit('permission-error', contextualError);
          } else {
              console.error("Failed to record like/dislike:", e);
          }
        }
    };

    recordLike(currentUser.id, targetUserId);
    // --- End Non-blocking Firestore operations ---

    // Move to next card immediately
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
