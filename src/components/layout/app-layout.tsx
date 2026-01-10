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
  const showBottomNav = authUser && user && !noBottomNavPaths.some(path => pathname.startsWith(path));

  // If it's an admin page, it controls its own layout entirely.
  if (isAdminPage) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto max-w-screen-sm w-full flex flex-col h-full">
      <main className={cn(
        "flex-1 overflow-y-auto",
        showBottomNav && "pb-20"
      )}>
          {children}
      </main>
      
      {showBottomNav && <BottomNav />}
      
      {/* Toasts are UI overlays and can remain here */}
      <IncomingCallToast />
      <NewLikeToast />
      <NewMatchToast />
      <NewMessageToast />
    </div>
  );
}
