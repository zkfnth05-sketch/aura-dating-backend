    'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import BottomNav from '@/components/layout/bottom-nav';
import { IncomingCallToast } from '@/components/incoming-call-toast';
import { NewLikeToast } from '@/components/new-like-toast';
import { NewMatchToast } from '@/components/new-match-toast';
import { NewMessageToast } from '@/components/new-message-toast';
import { cn } from '@/lib/utils';
import SplashScreen from '@/components/splash-screen';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // This runs only on the client
    if (sessionStorage.getItem('aura_splash_seen')) {
      setShowSplash(false);
      return;
    }

    const timer = setTimeout(() => {
      sessionStorage.setItem('aura_splash_seen', 'true');
      setShowSplash(false);
    }, 2500); 

    return () => clearTimeout(timer);
  }, []);

  const pathname = usePathname();
  const { authUser, user } = useUser();

  const isAdminPage = pathname.startsWith('/admin');
  
  const noBottomNavPaths = ['/signup', '/profile/edit', '/filter', '/chat'];
  
  const showBottomNav = authUser && user && !noBottomNavPaths.some(path => pathname.startsWith(path));

  if (showSplash) {
    return <SplashScreen />;
  }

  if (isAdminPage) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto max-w-screen-sm w-full flex flex-col h-[100dvh] relative bg-background">
      <main className={cn(
        "flex-1 flex flex-col min-h-0",
      )}>
        <div className={cn(
            "flex-1 overflow-y-auto", 
            showBottomNav ? "pb-20" : "" 
        )}>
          {children}
        </div>
      </main>
      
      {showBottomNav && (
        <div className="z-50">
          <BottomNav />
        </div>
      )}
      
      <IncomingCallToast />
      <NewLikeToast />
      <NewMatchToast />
      <NewMessageToast />
    </div>
  );
}
