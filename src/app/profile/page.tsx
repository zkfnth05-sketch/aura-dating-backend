
'use client';

import { useState } from 'react';
import { useUser } from '@/contexts/user-context';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { MapPin, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import ImageCarouselDialog from '@/components/image-carousel-dialog';
import Header from '@/components/layout/header';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { TranslationKeys } from '@/lib/locales';
import CoachMarkGuide from '@/components/coach-mark-guide';
import { profileGuide } from '@/lib/coachmark-steps';

// Helper components for page structure
const ProfileSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="py-4">
    <h3 className="font-semibold text-primary text-sm mb-3">{title}</h3>
    {children}
  </div>
);

const ProfileToggle = ({ label, id, checked, onCheckedChange, isLast = false, disabled = false }: { label: string, id: string, checked: boolean, onCheckedChange: (checked: boolean) => void, isLast?: boolean, disabled?: boolean }) => (
    <div className={cn("flex items-center justify-between py-4", !isLast && "border-b")}>
      <label htmlFor={id} className={cn("text-foreground/80", disabled && "opacity-50")}>{label}</label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );


export default function ProfilePage() {
  const { user: currentUser, notificationSettings, updateNotificationSettings, subscribeToPushNotifications } = useUser();
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSettingChange = async (id: keyof typeof notificationSettings, checked: boolean) => {
    updateNotificationSettings({ [id]: checked });

    // If the main "all notifications" toggle is turned on, initiate push subscription
    if (id === 'all' && checked) {
      if (Notification.permission === 'granted') {
        setIsSubscribing(true);
        await subscribeToPushNotifications();
        setIsSubscribing(false);
      } else if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setIsSubscribing(true);
          await subscribeToPushNotifications();
          setIsSubscribing(false);
        } else {
           toast({
              variant: 'destructive',
              title: t('push_noti_denied_title'),
              description: t('push_noti_denied_desc'),
          });
          updateNotificationSettings({ all: false }); // Revert toggle if permission denied
        }
      } else {
        // Permission is denied
        toast({
            variant: 'destructive',
            title: t('push_noti_denied_title'),
            description: t('push_noti_denied_desc'),
        });
        updateNotificationSettings({ all: false }); // Revert toggle if permission denied
      }
    }
  };
  
  // Render immediately if we have user data, otherwise show a loader.
  if (!currentUser) {
    return (
      <div className="flex flex-col h-full">
        <Header/>
        <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const allPhotos = currentUser.photoUrls || [];

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsCarouselOpen(true);
  }

  return (
    <>
      <CoachMarkGuide guide={profileGuide} />
      <div className="bg-background text-foreground">
        <Header />
        <main>
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
                    {currentUser.name}, {currentUser.age}, {t(currentUser.gender as TranslationKeys) || currentUser.gender}
                </h1>
                <p className="text-muted-foreground">{currentUser.location}</p>
            </div>
          </div>

          <div className="container relative z-10 px-4 mt-6">
            <div className={cn(
                "text-sm rounded-lg p-3 flex items-center justify-between mb-6",
                notificationSettings.locationShared
                    ? "bg-blue-900/50 border border-blue-400 text-blue-200"
                    : "bg-zinc-800/50 border border-zinc-700 text-zinc-400"
            )}>
              <div className="flex items-center gap-2">
                <MapPin className={cn("h-4 w-4", notificationSettings.locationShared ? "text-blue-300" : "text-zinc-500")} />
                <span>
                  {notificationSettings.locationShared
                    ? t('profile_location_sharing_on_desc')
                    : t('profile_location_sharing_off_desc')}
                </span>
              </div>
              <Switch
                id="location-banner-toggle"
                checked={notificationSettings.locationShared}
                onCheckedChange={(checked) => handleSettingChange('locationShared', checked)}
                className={cn(notificationSettings.locationShared ? 'data-[state=checked]:bg-blue-400' : 'data-[state=unchecked]:bg-zinc-700')}
              />
            </div>

            <div className="bg-card p-4 rounded-lg">

              <ProfileSection title={t('bio_section_title')}>
                <p className="text-sm text-foreground/80">{currentUser.bio}</p>
              </ProfileSection>

              {currentUser.relationship && currentUser.relationship.length > 0 && (
                <ProfileSection title={t('relationship_section_title')}>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.relationship.map(item => (
                      <Badge key={item} variant="secondary" className="bg-accent text-accent-foreground font-normal">{t(item as TranslationKeys)}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}

              {currentUser.values && currentUser.values.length > 0 && (
                <ProfileSection title={t('values_section_title')}>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.values.map(item => (
                      <Badge key={item} variant="secondary" className="bg-accent text-accent-foreground font-normal">{t(item as TranslationKeys)}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}

              {currentUser.communication && currentUser.communication.length > 0 && (
                <ProfileSection title={t('communication_section_title')}>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.communication.map(item => (
                      <Badge key={item} variant="secondary" className="bg-accent text-accent-foreground font-normal">{t(item as TranslationKeys)}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}

              {currentUser.lifestyle && currentUser.lifestyle.length > 0 && (
                <ProfileSection title={t('lifestyle_section_title')}>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.lifestyle.map(item => (
                      <Badge key={item} variant="secondary" className="bg-accent text-accent-foreground font-normal">{t(item as TranslationKeys)}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}

              {currentUser.interests && currentUser.interests.length > 0 && (
                <ProfileSection title={t('interests_section_title')}>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.interests.map(interest => (
                      <Badge key={interest} variant="secondary" className="bg-accent text-accent-foreground font-normal">{t(interest as TranslationKeys)}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}

              {currentUser.hobbies && currentUser.hobbies.length > 0 && (
                <ProfileSection title={t('hobbies_section_title')}>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.hobbies.map(hobby => (
                      <Badge key={hobby} variant="secondary" className="bg-accent text-accent-foreground font-normal">{t(hobby as TranslationKeys)}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}

              <ProfileSection title={t('profile_settings_section')}>
                  <ProfileToggle 
                    id="location"
                    label={t('profile_location_sharing')} 
                    checked={notificationSettings.locationShared}
                    onCheckedChange={(checked) => handleSettingChange('locationShared', checked)}
                  />
                  <ProfileToggle 
                    id="notifications"
                    label={t('profile_notifications')} 
                    checked={notificationSettings.all}
                    onCheckedChange={(checked) => handleSettingChange('all', checked)}
                    disabled={isSubscribing}
                  />
                  <ProfileToggle 
                    id="newMatch"
                    label={t('profile_new_match_noti')} 
                    checked={notificationSettings.newMatch}
                    onCheckedChange={(checked) => handleSettingChange('newMatch', checked)}
                  />
                  <ProfileToggle 
                    id="newMessage"
                    label={t('profile_new_message_noti')} 
                    checked={notificationSettings.newMessage}
                    onCheckedChange={(checked) => handleSettingChange('newMessage', checked)}
                  />
                  <ProfileToggle 
                    id="videoCall"
                    label={t('profile_video_call_noti')} 
                    checked={notificationSettings.videoCall}
                    onCheckedChange={(checked) => handleSettingChange('videoCall', checked)}
                    isLast={true}
                  />
              </ProfileSection>
            </div>

            <div className="py-8">
              <Button asChild className="w-full h-12 bg-primary text-primary-foreground rounded-full font-bold text-base">
                  <Link href="/profile/edit">{t('profile_edit_button')}</Link>
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
