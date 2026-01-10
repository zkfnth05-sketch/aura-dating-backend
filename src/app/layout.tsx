'use client';

import type { Metadata } from 'next';
import '@/app/globals.css';
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from '@/contexts/user-context';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import AppLayout from '@/components/layout/app-layout';


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="ko" className="dark h-full" suppressHydrationWarning>
      <head>
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
      <body className="font-body antialiased h-full" suppressHydrationWarning>
        <FirebaseClientProvider>
          <UserProvider>
            <AppLayout>
              {children}
            </AppLayout>
            <Toaster />
          </UserProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
