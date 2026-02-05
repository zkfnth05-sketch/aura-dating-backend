'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MapClient from '@/components/map-client';
import Header from '@/components/layout/header';
import { useUser } from '@/contexts/user-context';
import { APIProvider } from '@vis.gl/react-google-maps';
import { Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';


export default function MapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { user: currentUser, isLoaded: isUserLoaded } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { t } = useLanguage();
  const [mapUsers, setMapUsers] = useState<User[]>([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState(true);
  const [center, setCenter] = useState({ lat: 37.5665, lng: 126.9780 }); // Default to Seoul

  useEffect(() => {
    // Redirect if not logged in
    if (isUserLoaded && !currentUser) {
      router.replace('/signup');
    }
  }, [isUserLoaded, currentUser, router]);

  useEffect(() => {
    if (currentUser?.lat && currentUser?.lng) {
      setCenter({ lat: currentUser.lat, lng: currentUser.lng });
    } else {
      // Fallback to geolocation if user location not available
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCenter({ lat: latitude, lng: longitude });
          },
          (error) => {
            console.error("Geolocation error:", error);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      }
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchInitialUsers = async () => {
      if (!currentUser || !firestore) {
        setMapUsers([]);
        setIsFetchingUsers(false);
        return;
      }
  
      setIsFetchingUsers(true);
      try {
        let genderFilter = currentUser.gender === '남성' ? ['여성'] : 
                             currentUser.gender === '여성' ? ['남성'] : ['남성', '여성', '기타'];
  
        const usersQuery = query(
          collection(firestore, 'users'),
          where('gender', 'in', genderFilter),
          limit(50) // Increased limit to show more users on map
        );
        
        const snapshot = await getDocs(usersQuery);
        const fetchedUsers = snapshot.docs.map(d => d.data() as User);
        
        const otherUsers = fetchedUsers.filter(u => {
            if (u.id === currentUser.id) return false;
            if (currentUser.blockedUsers?.includes(u.id)) return false;
            if (u.blockedUsers?.includes(currentUser.id)) return false;
            return true;
        });
        // Ensure current user is always on the map
        setMapUsers([currentUser, ...otherUsers]);
  
      } catch (error) {
        console.error("Error fetching map users:", error);
      } finally {
        setIsFetchingUsers(false);
      }
    };
  
    if (isUserLoaded && currentUser) {
      fetchInitialUsers();
    }
  }, [currentUser, firestore, isUserLoaded]);

  if (!apiKey) {
    return (
      <div className="flex flex-col flex-1 h-full">
        <Header />
        <main className="container py-8 text-center">
          <h1 className="text-2xl font-bold text-destructive">{t('no_map_api_key_title')}</h1>
          <p className="mt-4 text-muted-foreground">
            {t('no_map_api_key_subtitle')}
          </p>
          <pre className="mt-4 p-4 bg-card rounded-lg text-left overflow-x-auto">
            <code>
{`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_API_KEY_HERE"`}
            </code>
          </pre>
           <p className="mt-4 text-muted-foreground">
            {t('no_map_api_key_restart')}
          </p>
        </main>
      </div>
    );
  }

  if (!isUserLoaded || !currentUser) {
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
    <div className="h-full flex flex-col">
      <Header />
      <div className="flex-1">
        {isFetchingUsers ? (
            <div className="flex-1 flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
            <APIProvider apiKey={apiKey} className="w-full h-full">
              <MapClient users={mapUsers} currentUser={currentUser} initialCenter={center} />
            </APIProvider>
        )}
      </div>
    </div>
  );
}
