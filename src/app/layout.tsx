'use client';

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import BottomNav from '@/components/layout/bottom-nav';
import { UserProvider, useUser } from '@/contexts/user-context';
import { IncomingCallToast } from '@/components/incoming-call-toast';
import { NewLikeToast } from '@/components/new-like-toast';
import { usePathname } from 'next/navigation';
import { FirebaseClientProvider } from '@/firebase/client-provider';

function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { authUser, user } = useUser();
  
  const isAdminPage = pathname.startsWith('/admin');
  
  const noBottomPaddingPaths = ['/chat', '/profile/edit', '/users', '/filter', '/signup'];
  const needsPadding = !noBottomPaddingPaths.some(path => pathname.startsWith(path));
  const showBottomNav = !!(authUser && user?.photoUrls && user.photoUrls.length > 0);

  if (isAdminPage) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto max-w-screen-sm w-full flex flex-col min-h-screen">
      <main className={`flex-1 ${needsPadding ? 'pb-24' : ''}`}>
          {children}
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="ko" className="dark">
      <head>
        {/* We can still have a head tag in a client component */}
        <title>Aura - 새로운 만남의 시작</title>
        <meta name="description" content="Aura와 함께 당신의 인연을 찾아보세요." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <UserProvider>
            <AppLayout>
              {children}
            </AppLayout>
            <Toaster />
            <IncomingCallToast />
            <NewLikeToast />
          </UserProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
