'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { potentialMatches } from '@/lib/data';
import type { User } from '@/lib/types';

export function NotificationSimulator() {
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const userForMatch = potentialMatches.find(u => u.id === 'user-1');
    const userForMessage = potentialMatches.find(u => u.id === 'user-2');
    // The video call toast in previous version links to match-2 which is user-2.
    // Let's use user-3 for variety.
    const userForVideoCall = potentialMatches.find(u => u.id === 'user-3');

    const showNewMatchToast = (user?: User) => {
      if (!user) return;
      toast({
        title: '새로운 매치! ✨',
        description: (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photoUrl} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{user.name}님과 매치되었습니다. 지금 확인해보세요.</span>
          </div>
        ),
        action: (
          <Button variant="secondary" size="sm" onClick={() => router.push(`/users/${user.id}`)}>
            보러가기
          </Button>
        ),
      });
    };

    const showNewMessageToast = (user?: User) => {
      if (!user) return;
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

    const showVideoCallToast = (user?: User) => {
      if (!user) return;
      toast({
        title: '영상통화 요청 📞',
        description: (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photoUrl} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{user.name}님이 영상통화를 요청했습니다.</span>
          </div>
        ),
        action: (
            // Assuming the video call with user-3 is through a match we don't have,
            // we'll just go to their profile for now.
            <Button variant="secondary" size="sm" onClick={() => router.push(`/chat/match-2`)}>
              수락
            </Button>
          ),
      });
    };

    const matchTimeout = setTimeout(() => showNewMatchToast(userForMatch), 5000); // 5초 후
    const messageTimeout = setTimeout(() => showNewMessageToast(userForMessage), 12000); // 12초 후
    const videoCallTimeout = setTimeout(() => showVideoCallToast(userForMessage), 20000); // 20초 후

    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      clearTimeout(matchTimeout);
      clearTimeout(messageTimeout);
      clearTimeout(videoCallTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
