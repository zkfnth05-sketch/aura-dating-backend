'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export function NotificationSimulator() {
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const showNewMatchToast = () => {
      toast({
        title: '새로운 매치! ✨',
        description: '지아님과 매치되었습니다. 지금 확인해보세요.',
        action: (
          <Button variant="secondary" size="sm" onClick={() => router.push('/users/user-1')}>
            보러가기
          </Button>
        ),
      });
    };

    const showNewMessageToast = () => {
      toast({
        title: '새로운 메시지 💌',
        description: '서준님으로부터 메시지가 도착했습니다.',
        action: (
            <Button variant="secondary" size="sm" onClick={() => router.push('/chat/match-2')}>
              답장하기
            </Button>
          ),
      });
    };

    const showVideoCallToast = () => {
      toast({
        title: '영상통화 요청 📞',
        description: '하윤님이 영상통화를 요청했습니다.',
        action: (
            <Button variant="secondary" size="sm" onClick={() => router.push('/chat/match-2')}>
              수락
            </Button>
          ),
      });
    };

    const matchTimeout = setTimeout(showNewMatchToast, 5000); // 5초 후
    const messageTimeout = setTimeout(showNewMessageToast, 12000); // 12초 후
    const videoCallTimeout = setTimeout(showVideoCallToast, 20000); // 20초 후

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
