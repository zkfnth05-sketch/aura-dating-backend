    'use client';

import { usePathname } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import BottomNav from '@/components/layout/bottom-nav';
import { IncomingCallToast } from '@/components/incoming-call-toast';
import { NewLikeToast } from '@/components/new-like-toast';
import { NewMatchToast } from '@/components/new-match-toast';
import { NewMessageToast } from '@/components/new-message-toast';
import { cn } from '@/lib/utils';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { authUser, user } = useUser();

  const isAdminPage = pathname.startsWith('/admin');
  
  const noBottomNavPaths = ['/signup', '/profile/edit', '/filter', '/chat'];
  // 채팅방 상세 페이지('/chat/...')에서는 네비게이션을 숨기지만, 채팅 목록('/chat')에서는 보여야 한다면 로직 확인 필요
  // 현재 로직은 /chat으로 시작하면 무조건 숨김입니다.
  
  const showBottomNav = authUser && user && !noBottomNavPaths.some(path => pathname.startsWith(path));

  if (isAdminPage) {
    return <>{children}</>;
  }

  return (
    // h-full 대신 h-[100dvh]를 사용하여 모바일 주소창 높이 변화에 대응
    <div className="mx-auto max-w-screen-sm w-full flex flex-col h-[100dvh] relative bg-background">
      <main className={cn(
        "flex-1 flex flex-col min-h-0", // min-h-0: flex 자식 스크롤 버그 방지
      )}>
        {/* 실제 스크롤 되는 영역 */}
        <div className={cn(
            "flex-1 overflow-y-auto", 
            // BottomNav가 보일 때는 하단에 패딩을 줘서 컨텐츠가 가려지지 않게 함
            showBottomNav ? "pb-20" : "" 
        )}>
          {children}
        </div>
      </main>
      
      {/* BottomNav는 보통 fixed로 되어 있으므로 흐름 밖에서 렌더링되거나,
          flex 흐름 안에 있다면 main 아래에 위치합니다. 
          z-index를 주어 컨텐츠 위에 뜨도록 보장합니다. */}
      {showBottomNav && (
        <div className="z-50">
          <BottomNav />
        </div>
      )}
      
      {/* Toasts */}
      <div className="absolute top-0 left-0 right-0 z-50">
        <IncomingCallToast />
        <NewLikeToast />
        <NewMatchToast />
        <NewMessageToast />
      </div>
    </div>
  );
}
