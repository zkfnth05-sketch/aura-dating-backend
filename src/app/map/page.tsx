'use client';

import MapClient from '@/components/map-client';
import Header from '@/components/layout/header';
import { useUser } from '@/contexts/user-context';
import { APIProvider } from '@vis.gl/react-google-maps';
import { useFirestore } from '@/firebase';
import { collection, query, getDocs, limit, where } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function MapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { user: currentUser, isLoaded: isUserLoaded } = useUser();
  const firestore = useFirestore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser || !firestore) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        let usersQuery;
        if (currentUser.gender === '남성') {
            usersQuery = query(collection(firestore, 'users'), where('gender', '==', '여성'), limit(100));
        } else if (currentUser.gender === '여성') {
            usersQuery = query(collection(firestore, 'users'), where('gender', '==', '남성'), limit(100));
        } else {
            // '기타' 성별이거나 성별 정보가 없을 경우, 모든 성별을 100명까지 가져옴 (본인 제외)
            usersQuery = query(collection(firestore, 'users'), where('id', '!=', currentUser.id), limit(100));
        }
        
        const usersSnapshot = await getDocs(usersQuery);
        const fetchedUsers = usersSnapshot.docs.map(doc => doc.data() as User);

        // Ensure current user is always on the map
        const finalUsers = [currentUser, ...fetchedUsers.filter(u => u.id !== currentUser.id)];
        
        setUsers(finalUsers);

      } catch (error) {
        console.error("Error fetching users for map:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isUserLoaded) {
        fetchUsers();
    }
  }, [currentUser, firestore, isUserLoaded]);


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

  if (isLoading || !isUserLoaded || !currentUser) {
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
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex flex-col">
            <MapClient users={users} currentUser={currentUser} />
        </main>
      </div>
    </APIProvider>
  );
}
