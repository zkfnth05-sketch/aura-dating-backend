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
  
  const noBottomNavPaths = ['/signup', '/profile/edit', '/filter', '/chat'];
  const showBottomNav = authUser && user && !noBottomNavPaths.some(path => pathname.startsWith(path));

  // If it's an admin page, it controls its own layout entirely.
  if (isAdminPage) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto max-w-screen-sm w-full flex flex-col min-h-[100svh]">
      {/* 
        The main content area now uses flex-1 to take up all available space, 
        allowing child pages like the map to fill the screen correctly.
      */}
      <main className="flex-1 flex flex-col overflow-hidden">
          {children}
      </main>
      
      {/* 
        The bottom nav is a sibling to the main content area, not inside it.
        It is fixed to the bottom and will not interfere with the main content's layout.
      */}
      {showBottomNav && <BottomNav />}
      
      {/* Toasts are UI overlays and can remain here */}
      <IncomingCallToast />
      <NewLikeToast />
      <NewMatchToast />
      <NewMessageToast />
    </div>
  );
}
