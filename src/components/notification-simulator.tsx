'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { potentialMatches } from '@/lib/data';
import type { User } from '@/lib/types';
import { useUser } from '@/contexts/user-context';

export function NotificationSimulator() {
  const { toast } = useToast();
  const router = useRouter();
  const { notificationSettings, isLoaded } = useUser();

  useEffect(() => {
    // Wait until context is loaded from localStorage
    if (!isLoaded) {
      return;
    }

    // Only run for signed-up users.
    const isSignedUp = localStorage.getItem('isSignedUp') === 'true';
    if (!isSignedUp) {
        return;
    }

    if (!notificationSettings.all) {
        return;
    }

    // A user who likes the current user, but is not liked back yet.
    const userForLike = potentialMatches.find(u => u.id === 'user-7');
    // A user who is mutually liked.
    const userForMatch = potentialMatches.find(u => u.id === 'user-5');
    // A user for the message notification.
    const userForMessage = potentialMatches.find(u => u.id === 'user-2');


    const showNewLikeToast = (user?: User) => {
      if (!user || !notificationSettings.newMatch) return; // Using newMatch setting for likes as well
      toast({
        title: '새로운 좋아요! ❤️',
        description: (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photoUrl} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{user.name}님이 회원님을 좋아합니다.</span>
          </div>
        ),
        action: (
          <Button variant="secondary" size="sm" onClick={() => router.push(`/matches`)}>
            확인하기
          </Button>
        ),
      });
    };

    const showNewMatchToast = (user?: User) => {
      if (!user || !notificationSettings.newMatch) return;
      toast({
        title: '새로운 매치! ✨',
        description: (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photoUrl} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{user.name}님과 매치되었습니다. 지금 대화를 시작해보세요.</span>
          </div>
        ),
        action: (
          <Button variant="secondary" size="sm" onClick={() => router.push(`/chat/match-${user.id.split('-')[1]}`)}>
            대화하기
          </Button>
        ),
      });
    };

    const showNewMessageToast = (user?: User) => {
      if (!user || !notificationSettings.newMessage) return;
      toast({
        title: '새로운 메시지 💌',
        description: (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photoUrl} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{user.name}님으로부터 메시지가 도착했습니다.</span>
          </div>
        ),
        action: (
            <Button variant="secondary" size="sm" onClick={() => router.push('/chat/match-2')}>
              답장하기
            </Button>
          ),
      });
    };

    const likeTimeout = setTimeout(() => showNewLikeToast(userForLike), 5000); // 5초 후: "좋아요" 알림
    const matchTimeout = setTimeout(() => showNewMatchToast(userForMatch), 12000); // 12초 후: "매치" 알림
    const messageTimeout = setTimeout(() => showNewMessageToast(userForMessage), 18000); // 18초 후: "메시지" 알림

    return () => {
      clearTimeout(likeTimeout);
      clearTimeout(matchTimeout);
      clearTimeout(messageTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, notificationSettings, router, toast]);

  return null;
}
