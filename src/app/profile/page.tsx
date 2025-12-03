'use client';

import { useState } from 'react';
import { useUser } from '@/contexts/user-context';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { MapPin, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import ImageCarouselDialog from '@/components/image-carousel-dialog';

// Helper components for page structure
const ProfileSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="py-4">
    <h3 className="font-semibold text-primary text-sm mb-3">{title}</h3>
    {children}
  </div>
);

const ProfileToggle = ({ label, id, checked, onCheckedChange, isLast = false }: { label: string, id: string, checked: boolean, onCheckedChange: (checked: boolean) => void, isLast?: boolean }) => (
    <div className={cn("flex items-center justify-between py-4", !isLast && "border-b")}>
      <label htmlFor={id} className="text-foreground/80">{label}</label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );


export default function ProfilePage() {
  const { user: currentUser, notificationSettings, updateNotificationSettings } = useUser();
  const [showLocationBanner, setShowLocationBanner] = useState(true);
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleSettingChange = (id: keyof typeof notificationSettings) => (checked: boolean) => {
    updateNotificationSettings({ [id]: checked });
  };
  
  const allPhotos = currentUser.photoUrls || [currentUser.photoUrl];

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsCarouselOpen(true);
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        {/* Remove Header to have full screen control */}
        {/* <Header /> */}
        <main className="flex-1">
          <div className="relative w-full aspect-[3/4] max-h-[70vh] cursor-pointer" onClick={() => handleImageClick(0)}>
            {allPhotos[0] && (
              <Image
                src={allPhotos[0]}
                alt={`Profile of ${currentUser.name}`}
                fill
                className="object-cover"
                data-ai-hint="person portrait"
                priority
              />
            )}
          </div>
          
          <div className="container relative z-10 px-4">
            <div className="grid grid-cols-3 gap-2 mt-4">
                {allPhotos.slice(1).map((photoUrl, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden cursor-pointer" onClick={() => handleImageClick(index + 1)}>
                        <Image 
                            src={photoUrl}
                            alt={`More photo of ${currentUser.name} ${index + 1}`}
                            fill
                            className="object-cover"
                            data-ai-hint="person portrait"
                        />
                    </div>
                ))}
            </div>
            <div className="text-left mt-4">
                <h1 className="text-3xl font-bold">
                    {currentUser.name}, {currentUser.age}, {currentUser.gender}
                </h1>
                <p className="text-muted-foreground">{currentUser.location}</p>
            </div>
          </div>

          <div className="container relative z-10 px-4 mt-6">
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

              {currentUser.relationship && currentUser.relationship.length > 0 && (
                <ProfileSection title="찾는 관계">
                  <div className="flex flex-wrap gap-2">
                    {currentUser.relationship.map(item => (
                      <Badge key={item} variant="secondary" className="bg-accent text-accent-foreground font-normal">{item}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}

              {currentUser.values && currentUser.values.length > 0 && (
                <ProfileSection title="가치관">
                  <div className="flex flex-wrap gap-2">
                    {currentUser.values.map(item => (
                      <Badge key={item} variant="secondary" className="bg-accent text-accent-foreground font-normal">{item}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}

              {currentUser.communication && currentUser.communication.length > 0 && (
                <ProfileSection title="소통 스타일">
                  <div className="flex flex-wrap gap-2">
                    {currentUser.communication.map(item => (
                      <Badge key={item} variant="secondary" className="bg-accent text-accent-foreground font-normal">{item}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}

              {currentUser.lifestyle && currentUser.lifestyle.length > 0 && (
                <ProfileSection title="라이프스타일">
                  <div className="flex flex-wrap gap-2">
                    {currentUser.lifestyle.map(item => (
                      <Badge key={item} variant="secondary" className="bg-accent text-accent-foreground font-normal">{item}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}

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
                    checked={true} // This seems to be a placeholder, adjust if state is needed
                    onCheckedChange={() => {}}
                  />
                  <ProfileToggle 
                    id="notifications"
                    label="알림 설정" 
                    checked={notificationSettings.all}
                    onCheckedChange={handleSettingChange('all')}
                  />
                  <ProfileToggle 
                    id="newMatch"
                    label="새로운 매치"
                    checked={notificationSettings.newMatch}
                    onCheckedChange={handleSettingChange('newMatch')}
                  />
                  <ProfileToggle 
                    id="newMessage"
                    label="새로운 메시지" 
                    checked={notificationSettings.newMessage}
                    onCheckedChange={handleSettingChange('newMessage')}
                  />
                  <ProfileToggle 
                    id="videoCall"
                    label="영상 통화 요청" 
                    checked={notificationSettings.videoCall}
                    onCheckedChange={handleSettingChange('videoCall')}
                    isLast={true}
                  />
              </ProfileSection>
            </div>

            <div className="py-8">
              <Button asChild className="w-full h-12 bg-primary text-primary-foreground rounded-full font-bold text-base">
                  <Link href="/profile/edit">프로필 수정</Link>
              </Button>
            </div>
          </div>
        </main>
      </div>

      <ImageCarouselDialog 
        isOpen={isCarouselOpen}
        onClose={() => setIsCarouselOpen(false)}
        images={allPhotos}
        startIndex={selectedImageIndex}
      />
    </>
  );
}
