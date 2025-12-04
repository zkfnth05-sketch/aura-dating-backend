'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import type { User } from '@/lib/types';
import { useUser } from '@/contexts/user-context';
// Mock data is no longer the source of truth, but we can use it for simulation logic if needed.
// For a real app, this might come from a Firestore listener.

const simulatedUsersForNotifications = {
    like: { id: 'user-7', name: '지민', photoUrl: 'https://images.unsplash.com/photo-1437623889155-075d40e2e59f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHx3b21hbiUyMGNpdHl8ZW58MHx8fHwxNzY0NzQxODQ1fDA&ixlib=rb-4.1.0&q=80&w=1080' },
    match: { id: 'user-5', name: '서연', photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1976&auto=format&fit=crop' },
    message: { id: 'user-2', name: '서준', photoUrl: 'https://images.unsplash.com/photo-1659769431940-9157f010bcdd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxtYW4lMjBvdXRkb29yc3xlbnwwfHx8fDE3NjQ3MTMwMTB8MA&ixlib=rb-4.1.0&q=80&w=1080' },
}

export function NotificationSimulator() {
  const { toast } = useToast();
  const router = useRouter();
  const { notificationSettings, isLoaded, authUser } = useUser();

  useEffect(() => {
    if (!isLoaded || !authUser) {
      return;
    }

    if (!notificationSettings.all) {
        return;
    }

    const userForLike = simulatedUsersForNotifications.like as User;
    const userForMatch = simulatedUsersForNotifications.match as User;
    const userForMessage = simulatedUsersForNotifications.message as User;


    const showNewLikeToast = (user?: User) => {
      if (!user || !notificationSettings.newMatch) return; 
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
          <Button variant="secondary" size="sm" onClick={() => router.push(`/chat/${user.id}`)}>
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
            <Button variant="secondary" size="sm" onClick={() => router.push(`/chat/${user.id}`)}>
              답장하기
            </Button>
          ),
      });
    };

    const likeTimeout = setTimeout(() => showNewLikeToast(userForLike), 5000);
    const matchTimeout = setTimeout(() => showNewMatchToast(userForMatch), 12000);
    const messageTimeout = setTimeout(() => showNewMessageToast(userForMessage), 18000);

    return () => {
      clearTimeout(likeTimeout);
      clearTimeout(matchTimeout);
      clearTimeout(messageTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, authUser, notificationSettings, router, toast]);

  return null;
}
