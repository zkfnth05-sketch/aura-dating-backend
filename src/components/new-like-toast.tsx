'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, doc, getDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import type { Like, User } from '@/lib/types';
import Link from 'next/link';

export function NewLikeToast() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [lastSeenLikeTimestamp, setLastSeenLikeTimestamp] = useState<Timestamp | null>(null);

  const newLikesQuery = useMemoFirebase(() => {
    if (!currentUser?.id || !firestore) {
      return null;
    }
    // Query the top-level 'likes' collection for likes where the current user is the 'likee'
    return query(
      collection(firestore, 'likes'),
      where('likeeId', '==', currentUser.id),
      where('isLike', '==', true), // Only show for likes, not dislikes
      orderBy('timestamp', 'desc'),
      limit(1)
    );
  }, [firestore, currentUser]);

  const { data: newLikes } = useCollection<Like>(newLikesQuery);

  const showToast = useCallback(async (like: Like) => {
    if (!firestore || !like.likerId) return;

    try {
      const userRef = doc(firestore, 'users', like.likerId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const liker = userSnap.data() as User;

        toast({
          duration: 5000,
          title: '새로운 좋아요!',
          description: (
            <Link href={`/users/${liker.id}`} className="w-full">
              <div className="flex items-center gap-3 mt-2 cursor-pointer">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={liker.photoUrls?.[0]} alt={liker.name} />
                  <AvatarFallback>{liker.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span>{liker.name}님이 회원님을 좋아합니다.</span>
              </div>
            </Link>
          ),
        });
      }
    } catch (error) {
        console.error("Failed to fetch liker's profile for toast:", error);
    }
  }, [firestore, toast]);

  useEffect(() => {
    if (newLikes && newLikes.length > 0) {
      const latestLike = newLikes[0];
      
      if (latestLike && latestLike.timestamp && (!lastSeenLikeTimestamp || latestLike.timestamp.seconds > lastSeenLikeTimestamp.seconds)) {
        showToast(latestLike);
        setLastSeenLikeTimestamp(latestLike.timestamp);
      }
    }
  }, [newLikes, lastSeenLikeTimestamp, showToast]);

  return null;
}
