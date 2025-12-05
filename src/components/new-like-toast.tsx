'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useRouter } from 'next/navigation';
import type { LikedBy, User } from '@/lib/types';
import Link from 'next/link';

export function NewLikeToast() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast, dismiss } = useToast();
  const router = useRouter();

  // State to track the timestamp of the last seen like, to avoid showing old notifications
  const [lastSeenLikeTimestamp, setLastSeenLikeTimestamp] = useState<any | null>(null);

  const newLikesQuery = useMemoFirebase(() => {
    if (!currentUser?.id || !firestore) {
      return null;
    }
    // Listen for the most recent 'like' ordered by timestamp
    return query(
      collection(firestore, 'users', currentUser.id, 'likedBy'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
  }, [firestore, currentUser]);

  const { data: newLikes } = useCollection<LikedBy>(newLikesQuery);

  useEffect(() => {
    if (newLikes && newLikes.length > 0) {
      const latestLike = newLikes[0];
      
      // Check if this is a genuinely new like since the component was mounted/last seen
      if (latestLike && (!lastSeenLikeTimestamp || latestLike.timestamp?.seconds > lastSeenLikeTimestamp.seconds)) {

        const showToast = async () => {
            const likerId = latestLike.likerId;
            if (!likerId) return;

            const userRef = doc(firestore, 'users', likerId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const liker = userSnap.data() as User;

                const { id: toastId } = toast({
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
        };

        showToast();
        // Update the last seen timestamp to the latest one
        setLastSeenLikeTimestamp(latestLike.timestamp);
      }
    }
  // We only want to re-run this when newLikes data changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newLikes, firestore, toast, dismiss]);

  return null; // This component does not render anything itself
}
