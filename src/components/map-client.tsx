'use client';

import { useState, useEffect } from 'react';
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import type { User } from '@/lib/types';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface MapClientProps {
  users: User[];
  currentUser: User;
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

export default function MapClient({ users, currentUser }: MapClientProps) {
  const router = useRouter();
  
  const [zoom, setZoom] = useState(11);
  const [center, setCenter] = useState({ lat: currentUser.lat, lng: currentUser.lng });

  useEffect(() => {
    // Update center if currentUser's location changes
    if (currentUser.lat && currentUser.lng) {
      setCenter({ lat: currentUser.lat, lng: currentUser.lng });
    }
  }, [currentUser.lat, currentUser.lng]);


  const handleMarkerClick = (userId: string) => {
    if(userId === currentUser.id) {
      router.push('/profile');
    } else {
      router.push(`/users/${userId}`);
    }
  }

  return (
    <div className="flex-1 relative">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full px-4">
        <div className="bg-black/50 backdrop-blur-sm rounded-full p-1 flex justify-around items-center text-white text-sm font-semibold">
          {distanceOptions.map(option => (
            <button
              key={option.label}
              onClick={() => setZoom(option.zoom)}
              className={cn(
                'py-2 px-4 rounded-full transition-colors duration-200 w-full',
                zoom === option.zoom ? 'bg-primary text-primary-foreground' : 'bg-transparent text-white/80'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="absolute inset-0">
        <Map
          center={center}
          zoom={zoom}
          mapId={'dating-app-map-style'}
          disableDefaultUI={true}
          styles={mapStyles}
          gestureHandling={'greedy'}
        >
          {users.map((user) => (
            <AdvancedMarker
              key={user.id}
              position={{ lat: user.lat, lng: user.lng }}
              onClick={() => handleMarkerClick(user.id)}
            >
              <div 
                className={cn(
                    "relative w-12 h-12 rounded-full border-2 shadow-lg cursor-pointer transition-transform duration-200 hover:scale-110",
                    user.id === currentUser.id ? "border-primary" : "border-transparent"
                )}
              >
                <Image
                  src={user.photoUrls[0]}
                  alt={user.name}
                  fill
                  className="object-cover rounded-full"
                />
              </div>
            </AdvancedMarker>
          ))}
        </Map>
      </div>
    </div>
  );
}
