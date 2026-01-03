'use client';

import { useState, useEffect } from 'react';
import MapClient from '@/components/map-client';
import Header from '@/components/layout/header';
import { useUser } from '@/contexts/user-context';
import { APIProvider } from '@vis.gl/react-google-maps';
import { Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import type { User } from '@/lib/types';
import BottomNav from '@/components/layout/bottom-nav';


export default function MapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { user: currentUser, isLoaded } = useUser();
  const firestore = useFirestore();
  const [mapUsers, setMapUsers] = useState<User[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [center, setCenter] = useState({ lat: 37.5665, lng: 126.9780 }); // Default to Seoul

  useEffect(() => {
    if (currentUser) {
      setCenter({ lat: currentUser.lat, lng: currentUser.lng });
    }
  }, [currentUser]);

  useEffect(() => {
    let watchId: number;

    if (navigator.geolocation) {
      // Watch for position changes
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCenter({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error("Geolocation watch error:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    }

    // Cleanup watcher on component unmount
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);
  
  useEffect(() => {
    const fetchInitialUsers = async () => {
      if (!currentUser || !firestore) return;
      setIsInitialLoading(true);
      try {
        let genderFilter: string[];
        if (currentUser.gender === '남성') {
          genderFilter = ['여성'];
        } else if (currentUser.gender === '여성') {
          genderFilter = ['남성'];
        } else {
          genderFilter = ['남성', '여성', '기타'];
        }

        const usersQuery = query(
          collection(firestore, 'users'),
          where('gender', 'in', genderFilter),
          limit(20)
        );
        const snapshot = await getDocs(usersQuery);
        const fetchedUsers = snapshot.docs.map(d => d.data() as User);
        setMapUsers([currentUser, ...fetchedUsers.filter(u => u.id !== currentUser.id)]);
      } catch (error) {
        console.error("Error fetching initial map users:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    if (isLoaded && currentUser) {
      fetchInitialUsers();
    }
  }, [currentUser, firestore, isLoaded]);

  useEffect(() => {
    const fetchMoreUsers = async () => {
        if (!currentUser || !firestore || isInitialLoading) return;
        
        try {
            let genderFilter: string[];
            if (currentUser.gender === '남성') {
              genderFilter = ['여성'];
            } else if (currentUser.gender === '여성') {
              genderFilter = ['남성'];
            } else {
              genderFilter = ['남성', '여성', '기타'];
            }
            const usersQuery = query(
              collection(firestore, 'users'),
              where('gender', 'in', genderFilter),
              limit(100)
            );
            const snapshot = await getDocs(usersQuery);
            const fetchedUsers = snapshot.docs.map(d => d.data() as User);
            
            setMapUsers(prevUsers => {
                const allUsers = [...prevUsers, ...fetchedUsers];
                const uniqueUsers = Array.from(new Map(allUsers.map(u => [u.id, u])).values());
                return uniqueUsers;
            });

        } catch (error) {
            console.error("Error fetching more map users:", error);
        }
    };
    
    if(!isInitialLoading) {
        fetchMoreUsers();
    }
  }, [currentUser, firestore, isInitialLoading]);

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

  const isLoading = !isLoaded || isInitialLoading || !currentUser;

  if (isLoading) {
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
        <div className="relative h-screen w-full">
            <Header />
            <MapClient users={mapUsers} currentUser={currentUser} initialCenter={center} />
            <BottomNav />
        </div>
    </APIProvider>
  );
}
