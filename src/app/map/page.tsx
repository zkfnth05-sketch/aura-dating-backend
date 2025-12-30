'use client';

import MapClient from '@/components/map-client';
import Header from '@/components/layout/header';
import { useUser } from '@/contexts/user-context';
import { APIProvider } from '@vis.gl/react-google-maps';
import { Loader2 } from 'lucide-react';

export default function MapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { user: currentUser, isLoaded, isAppDataLoading, appData } = useUser();
  
  if (!apiKey) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container py-8 text-center">
          <h1 className="text-2xl font-bold text-destructive">Google Maps API 키가 필요합니다.</h1>
          <p className="mt-4 text-muted-foreground">
            지도 기능을 사용하려면, Google Cloud Platform에서 Google Maps API 키를 발급받아 프로젝트 루트의 <code className="bg-muted px-1 py-0.5 rounded-sm">.env</code> 파일에 추가해야 합니다.
          </p>
          <pre className="mt-4 p-4 bg-card rounded-lg text-left overflow-x-auto">
            <code>
{`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_API_KEY_HERE"`}
            </code>
          </pre>
           <p className="mt-4 text-muted-foreground">
            API 키를 추가한 후 개발 서버를 재시작해주세요.
          </p>
        </main>
      </div>
    );
  }

  if (!isLoaded || isAppDataLoading || !currentUser) {
      return (
        <div className="flex flex-col h-screen">
            <Header />
            <main className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </main>
        </div>
      );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="flex flex-col h-screen w-full">
        <Header />
        {/* The main content area takes up the remaining space */}
        <main style={{ height: 'calc(100vh - 56px)' }}>
            <MapClient users={appData.mapUsers} currentUser={currentUser} />
        </main>
      </div>
    </APIProvider>
  );
}
