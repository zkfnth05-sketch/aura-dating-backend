'use client';

import { useState, useEffect } from 'react';
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import type { User } from '@/lib/types';
import { Slider } from '@/components/ui/slider';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface MapClientProps {
  users: User[];
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


export default function MapClient({ users }: MapClientProps) {
  const router = useRouter();
  const [zoom, setZoom] = useState(11);
  const [center, setCenter] = useState({ lat: users[0].lat, lng: users[0].lng });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setZoom(14); // Zoom in closer when location is found
        },
        () => {
          console.log("Geolocation permission denied. Using default location.");
        }
      );
    }
  }, []);

  const handleMarkerClick = (userId: string) => {
    if(userId === 'current-user') {
      router.push('/profile');
    } else {
      router.push(`/users/${userId}`);
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="bg-background/95 p-4 pb-2">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">거리</span>
          <Slider
            min={8}
            max={15}
            step={1}
            value={[zoom]}
            onValueChange={(value) => setZoom(value[0])}
          />
        </div>
      </div>
      <div className="flex-1">
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
              <div className="relative w-12 h-12 rounded-full border-2 border-primary shadow-lg cursor-pointer transition-transform duration-200 hover:scale-110">
                <Image
                  src={user.photoUrl}
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
