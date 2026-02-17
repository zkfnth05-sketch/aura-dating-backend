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

// Module-level cache to persist data across component mounts within the same session.
let mapUsersCache: User[] | null = null;

export default function MapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { user: currentUser, isLoaded: isUserLoaded } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { t } = useLanguage();

  const [mapUsers, setMapUsers] = useState<User[]>(mapUsersCache || []);
  const [isFetching, setIsFetching] = useState(!mapUsersCache);
  const [center, setCenter] = useState({ lat: 37.5665, lng: 126.9780 });

  useEffect(() => {
    if (isUserLoaded && !currentUser) {
      // Clear cache on logout
      mapUsersCache = null;
      router.replace('/signup');
    }
  }, [isUserLoaded, currentUser, router]);

  useEffect(() => {
    if (currentUser?.lat && currentUser?.lng) {
      setCenter({ lat: currentUser.lat, lng: currentUser.lng });
    } else if (isUserLoaded && currentUser && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setCenter({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (error) => console.error("Geolocation error:", error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, [isUserLoaded, currentUser]);

  useEffect(() => {
    const fetchUsers = async () => {
      // 1. Caching & Smart Trigger: Only fetch if cache is empty and dependencies are ready.
      if (mapUsersCache || !currentUser || !firestore) {
        if(mapUsersCache) setIsFetching(false); // If using cache, stop loading indicator
        return;
      }

      setIsFetching(true);
      try {
        const genderFilter = currentUser.gender === '남성' ? ['여성'] : 
                             currentUser.gender === '여성' ? ['남성'] : ['남성', '여성', '기타'];

        const usersQuery = query(
          collection(firestore, 'users'),
          where('gender', 'in', genderFilter),
          limit(50)
        );
        
        const snapshot = await getDocs(usersQuery);
        const fetchedUsers = snapshot.docs.map(d => d.data() as User);
        
        const otherUsers = fetchedUsers.filter(u => 
          u.id !== currentUser.id &&
          !currentUser.blockedUsers?.includes(u.id) &&
          !u.blockedUsers?.includes(currentUser.id)
        );

        const newMapUsers = [currentUser, ...otherUsers];
        
        // 2. Update cache and state
        mapUsersCache = newMapUsers;
        setMapUsers(newMapUsers);

      } catch (error) {
        console.error("Error fetching map users:", error);
        mapUsersCache = null; // Clear cache on error
      } finally {
        setIsFetching(false);
      }
    };

    // 3. Smart Trigger: This effect now smartly decides whether to fetch.
    // It runs when the user is loaded, but the fetch logic inside is protected by the `mapUsersCache` check,
    // preventing re-fetches on minor currentUser object updates.
    if (isUserLoaded) {
      fetchUsers();
    }
  }, [isUserLoaded, currentUser, firestore]);

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
        {isFetching ? (
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
