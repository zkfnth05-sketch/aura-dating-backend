"use client";
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from '@/contexts/user-context';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import AppLayout from '@/components/layout/app-layout';
import { LanguageProvider } from '@/contexts/language-context';
import { useEffect } from 'react';


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('Service Worker registered with scope:', registration.scope))
            .catch(error => console.error('Service Worker registration failed:', error));
    }
  }, []);


  return (
    <html lang="ko" className="dark h-full" suppressHydrationWarning>
      <head>
        <title>Aura - 새로운 만남의 시작</title>
        <meta name="description" content="Aura와 함께 당신의 인연을 찾아보세요." />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="theme-color" content="#FFD700" />
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
      <body className="font-body antialiased h-full bg-background text-foreground" suppressHydrationWarning>
        <FirebaseClientProvider>
          <UserProvider>
            <LanguageProvider>
              <AppLayout>
                {children}
              </AppLayout>
              <Toaster />
            </LanguageProvider>
          </UserProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
