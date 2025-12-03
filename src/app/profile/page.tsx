'use client';

import { useState } from 'react';
import Header from '@/components/layout/header';
import { currentUser } from '@/lib/data';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { MapPin, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper components for page structure
const ProfileSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="py-4">
    <h3 className="font-semibold text-primary text-sm mb-3">{title}</h3>
    {children}
  </div>
);

const ProfileToggle = ({ label, id, checked, onCheckedChange }: { label: string, id: string, checked: boolean, onCheckedChange: (checked: boolean) => void }) => (
  <div className="flex items-center justify-between py-3">
    <label htmlFor={id} className="text-foreground/80">{label}</label>
    <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);


export default function ProfilePage() {
  const [showLocationBanner, setShowLocationBanner] = useState(true);
  const [settings, setSettings] = useState({
    location: true,
    notifications: true,
    newMatch: true,
    newMessage: true,
    videoCall: false,
  });

  const handleSettingChange = (id: keyof typeof settings) => (checked: boolean) => {
    setSettings(prev => ({...prev, [id]: checked}));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Remove Header to have full screen control */}
      {/* <Header /> */}
      <main className="flex-1">
        <div className="relative w-full h-[60svh]">
          <Image
            src={currentUser.photoUrl}
            alt={`Profile of ${currentUser.name}`}
            fill
            className="object-cover"
            data-ai-hint="person portrait"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          <div className="absolute bottom-4 left-4 text-white">
            <h1 className="text-3xl font-bold">
              {currentUser.name}, {currentUser.age}
            </h1>
            <p className="text-white/80">{currentUser.location}</p>
          </div>
        </div>

        <div className="container -mt-8 relative z-10 px-4">
          {showLocationBanner && (
            <div className="bg-blue-900/50 border border-blue-400 text-blue-200 text-sm rounded-lg p-3 flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-300" />
                <span>실시간 위치 공유가 활성화되어 있습니다.</span>
              </div>
              <button onClick={() => setShowLocationBanner(false)} className="text-blue-300 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="bg-card p-4 rounded-lg">

            <ProfileSection title="소개">
              <p className="text-sm text-foreground/80">{currentUser.bio}</p>
            </ProfileSection>

            <ProfileSection title="관심사">
              <div className="flex flex-wrap gap-2">
                {currentUser.interests.map(interest => (
                  <Badge key={interest} variant="secondary" className="bg-accent text-accent-foreground font-normal">{interest}</Badge>
                ))}
              </div>
            </ProfileSection>

            <ProfileSection title="취미">
              <div className="flex flex-wrap gap-2">
                {currentUser.hobbies.map(hobby => (
                  <Badge key={hobby} variant="secondary" className="bg-accent text-accent-foreground font-normal">{hobby}</Badge>
                ))}
              </div>
            </ProfileSection>

            <ProfileSection title="설정">
                <ProfileToggle 
                  id="location"
                  label="실시간 위치 공유" 
                  checked={settings.location}
                  onCheckedChange={handleSettingChange('location')}
                />
                 <ProfileToggle 
                  id="notifications"
                  label="알림 설정" 
                  checked={settings.notifications}
                  onCheckedChange={handleSettingChange('notifications')}
                />
                 <ProfileToggle 
                  id="newMatch"
                  label="새로운 매치" 
                  checked={settings.newMatch}
                  onCheckedChange={handleSettingChange('newMatch')}
                />
                 <ProfileToggle 
                  id="newMessage"
                  label="새로운 메시지" 
                  checked={settings.newMessage}
                  onCheckedChange={handleSettingChange('newMessage')}
                />
                 <ProfileToggle 
                  id="videoCall"
                  label="영상 통화 요청" 
                  checked={settings.videoCall}
                  onCheckedChange={handleSettingChange('videoCall')}
                />
            </ProfileSection>
          </div>

          <div className="py-8">
            <Button className="w-full h-12 bg-primary text-primary-foreground rounded-full font-bold text-base">
                프로필 수정
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
