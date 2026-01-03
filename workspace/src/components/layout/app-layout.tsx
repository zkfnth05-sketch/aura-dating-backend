'use client';

import { usePathname } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import BottomNav from '@/components/layout/bottom-nav';
import { IncomingCallToast } from '@/components/incoming-call-toast';
import { NewLikeToast } from '@/components/new-like-toast';
import { NewMatchToast } from '@/components/new-match-toast';
import { NewMessageToast } from '@/components/new-message-toast';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { authUser, user } = useUser();

  const isAdminPage = pathname.startsWith('/admin');
  
  // 채팅, 프로필 수정, 필터, 그리고 모든 회원가입 경로에서 하단 네비게이션 숨김
  const noBottomNavPaths = ['/signup', '/profile/edit', '/filter', '/chat'];
  const showBottomNav = authUser && user && !noBottomNavPaths.some(path => pathname.startsWith(path));

  if (isAdminPage) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto max-w-screen-sm w-full flex flex-col min-h-screen">
      <main className="flex-1 flex flex-col">
          {children}
      </main>
      
      {showBottomNav && <div className="pb-24" />}
      
      {showBottomNav && <BottomNav />}
      
      <IncomingCallToast />
      <NewLikeToast />
      <NewMatchToast />
      <NewMessageToast />
    </div>
  );
}
