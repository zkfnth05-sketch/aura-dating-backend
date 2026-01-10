'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import type { User } from '@/lib/types';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface MapClientProps {
  users: User[];
  currentUser: User | null;
  initialCenter: { lat: number; lng: number };
}

const mapStyles: google.maps.MapTypeStyle[] = [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#263c3f' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#6b9a76' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#38414e' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#212a37' }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9ca5b3' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#746855' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#1f2835' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#f3d19c' }],
    },
    {
      featureType: 'transit',
      elementType: 'geometry',
      stylers: [{ color: '#2f3948' }],
    },
    {
      featureType: 'transit.station',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#17263c' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#515c6d' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#17263c' }],
    },
];

const distanceOptions = [
    { label: '1km', zoom: 14 },
    { label: '5km', zoom: 12 },
    { label: '10km', zoom: 11 },
    { label: '25km', zoom: 10 },
    { label: '50km', zoom: 9 },
    { label: '100km', zoom: 8 },
];

const MemoizedAdvancedMarker = React.memo(function MemoizedAdvancedMarker({
  user,
  isCurrentUser,
  onClick,
}: {
  user: User;
  isCurrentUser: boolean;
  onClick: (userId: string) => void;
}) {
  if (typeof user.lat !== 'number' || typeof user.lng !== 'number') return null;

  return (
    <AdvancedMarker
      position={{ lat: user.lat, lng: user.lng }}
      onClick={() => onClick(user.id)}
    >
      <div 
        className={cn(
            "relative w-10 h-10 rounded-full border-2 shadow-md cursor-pointer transition-transform duration-200 hover:scale-110 will-change-transform",
            isCurrentUser ? "border-primary z-20" : "border-white z-10"
        )}
      >
        <Image
          src={user.photoUrls?.[0] || '/default-avatar.png'}
          alt={user.name}
          fill
          sizes="40px"
          priority={isCurrentUser}
          className="object-cover rounded-full"
        />
      </div>
    </AdvancedMarker>
  );
});
MemoizedAdvancedMarker.displayName = 'MemoizedAdvancedMarker';


export default function MapClient({ users, currentUser, initialCenter }: MapClientProps) {
  const router = useRouter();
  const [zoom, setZoom] = useState(11);
  
  const handleMarkerClick = useCallback((userId: string) => {
    if (currentUser && userId === currentUser.id) {
      router.push('/profile');
    } else {
      router.push(`/users/${userId}`);
    }
  }, [router, currentUser?.id]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <div className="absolute top-4 left-0 right-0 z-10 px-4">
        <div className="max-w-md mx-auto bg-black/60 backdrop-blur-md rounded-full p-1 flex justify-around items-center text-white">
          {distanceOptions.map(option => (
            <button
              key={option.label}
              onClick={() => setZoom(option.zoom)}
              className={cn(
                'py-1.5 px-3 rounded-full text-xs font-medium transition-all duration-200 flex-1',
                zoom === option.zoom ? 'bg-primary text-white shadow-sm' : 'hover:bg-white/10'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <Map
        defaultCenter={initialCenter}
        zoom={zoom}
        onZoomChanged={(e) => setZoom(e.detail.zoom)}
        mapId={'dating-app-map-style'}
        disableDefaultUI={true}
        gestureHandling={'greedy'}
        reuseMaps={true}
      >
        {users.map((user) => (
          <MemoizedAdvancedMarker
            key={user.id}
            user={user}
            isCurrentUser={!!currentUser && user.id === currentUser.id}
            onClick={handleMarkerClick}
          />
        ))}
      </Map>
    </div>
  );
}
