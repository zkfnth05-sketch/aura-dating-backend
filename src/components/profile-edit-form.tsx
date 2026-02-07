'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import { useLanguage } from '@/contexts/language-context';
import Image from 'next/image';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { X, Plus, Video, Camera, ImageIcon, Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn, compressImage } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import CameraDialog from '@/components/camera-dialog';
import { generateAnimatedPhoto } from '@/actions/ai-actions';
import { getAuth, deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ReauthDialog from './reauth-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TranslationKeys } from '@/lib/locales';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';

const FlagIcon = ({ code, ...props }: { code: string } & React.SVGProps<SVGSVGElement>) => {
  switch (code) {
    case 'ko':
        return <svg viewBox="0 0 900 600" {...props}><path fill="#fff" d="M0 0h900v600H0z"/><g transform="translate(450 300)"><circle r="150" fill="#cd2e3a"/><path d="M-150 0a150 150 0 0 0 300 0 75 75 0 0 1-150 0Z" fill="#0047a0"/></g><g fill="#000"><g transform="translate(193.2 143.2)rotate(33.69)"><path d="M-75-25h150v16.7h-150zm0 25h150v16.7h-150zm0 25h150v16.7h-150z"/></g><g transform="translate(193.2 456.8)rotate(-33.69)"><path d="M-75-25h150v16.7h-150zm0 25h50v16.7h-50zm100 0h50v16.7h-50zm-100 25h150v16.7h-150z"/></g><g transform="translate(706.8 143.2)rotate(-33.69)"><path d="M-75-25h50v16.7h-50zm100 0h50v16.7h-50zm-100 25h150v16.7h-150zm0 25h50v16.7h-50zm100 0h50v16.7h-50z"/></g><g transform="translate(706.8 456.8)rotate(33.69)"><path d="M-75-25h150v16.7h-150zm0 25h150v16.7h-150zm0 25h150v16.7h-150z"/></g></g></svg>;
    case 'en':
      return <svg viewBox="0 0 38 20" {...props}><path fill="#B22234" d="m0,0H38V20H0"/><path stroke="#fff" strokeWidth="2" d="m0,2H38m0,4H0m0,4H38m0,4H0"/><path fill="#3C3B6E" d="m0,0H18V10H0"/></svg>;
    case 'es':
      return <svg viewBox="0 0 30 20" {...props}><path fill="#C60B1E" d="M0 0h30v20H0z"/><path fill="#FFC400" d="M0 5h30v10H0z"/></svg>;
    case 'ja':
      return <svg viewBox="0 0 30 20" {...props}><path fill="#fff" d="M0 0h30v20H0z"/><circle cx="15" cy="10" r="6" fill="#BC002D"/></svg>;
    default:
      return null;
  }
};


const Section = ({ title, children, description }: { title: string, children: React.ReactNode, description?: string }) => (
  <div className="py-6">
    <h2 className="text-lg font-semibold text-primary">{title}</h2>
    {description && <p className="text-sm text-muted-foreground mt-1 mb-4">{description}</p>}
    <div className={cn(description && "mt-4")}>{children}</div>
  </div>
);

const TagButton = ({ label, isSelected, onClick }: { label: string, isSelected: boolean, onClick: () => void }) => (
  <Button
    variant={isSelected ? 'default' : 'secondary'}
    onClick={onClick}
    className={cn(
        "rounded-full h-auto py-2 px-4 text-sm font-normal",
        isSelected ? "bg-primary text-primary-foreground" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
    )}
  >
    {label}
  </Button>
);

type LanguageCode = 'ko' | 'en' | 'es' | 'ja';

const allValueKeys = {
  relationship: ['relationship_section_title_serious', 'relationship_section_title_casual', 'relationship_section_title_friends', 'relationship_section_title_chat'] as const,
  values: ['values_section_title_adventure', 'values_section_title_stability', 'values_section_title_creativity', 'values_section_title_growth', 'values_section_title_authenticity', 'values_section_title_passion', 'values_section_title_calmness', 'values_section_title_humor'] as const,
  communication: ['communication_section_title_deep', 'communication_section_title_witty', 'communication_section_title_sincere', 'communication_section_title_warm', 'communication_section_title_direct'] as const,
  lifestyle: ['lifestyle_section_title_active', 'lifestyle_section_title_homebody', 'lifestyle_section_title_artist', 'lifestyle_section_title_wellness', 'lifestyle_section_title_explorer', 'lifestyle_section_title_minimalist'] as const,
  hobbies: ['hobbies_section_title_movies', 'hobbies_section_title_music', 'hobbies_section_title_exercise', 'hobbies_section_title_cooking', 'hobbies_section_title_reading', 'hobbies_section_title_travel', 'hobbies_section_title_games', 'hobbies_section_title_camping', 'hobbies_section_title_watercolor', 'hobbies_section_title_baking', 'hobbies_section_title_coding', 'hobbies_section_title_piano', 'hobbies_section_title_scuba', 'hobbies_section_title_meditation'] as const,
  interests: ['interests_section_title_foodie', 'interests_section_title_cafe', 'interests_section_title_photo', 'interests_section_title_fashion', 'interests_section_title_beauty', 'interests_section_title_finance', 'interests_section_title_self_dev', 'interests_section_title_drawing', 'interests_section_title_hiking', 'interests_section_title_classical', 'interests_section_title_yoga', 'interests_section_title_reading'] as const
};

export default function ProfileEditForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser, updateUser, isLoaded, authUser } = useUser();
  const { t, setLanguage, supportedLanguages } = useLanguage();
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    location: '',
    bio: '',
    gender: '여성' as '남성' | '여성' | '기타',
    language: 'ko' as LanguageCode,
    relationship: [] as string[],
    values: [] as string[],
    communication: [] as string[],
    lifestyle: [] as string[],
    hobbies: [] as string[],
    interests: [] as string[],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [tempPhotoUri, setTempPhotoUri] = useState<string | null>(null);
  
  const [aiEnhancement, setAiEnhancement] = useState(true);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [isPhotoSourceDialogOpen, setIsPhotoSourceDialogOpen] = useState(false);
  const [isReauthDialogOpen, setIsReauthDialogOpen] = useState(false);

  const [isAnimateVideoDialogOpen, setIsAnimateVideoDialogOpen] = useState(false);
  const [selectedPhotoForVideo, setSelectedPhotoForVideo] = useState<string | null>(null);
  const [videoPrompt, setVideoPrompt] = useState<string>('');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);


  useEffect(() => {
    if (currentUser) {
      setProfile({
          name: currentUser.name || '',
          age: currentUser.age?.toString() || '',
          location: currentUser.location || '',
          bio: currentUser.bio || '',
          gender: currentUser.gender || '여성',
          language: currentUser.language || 'ko',
          relationship: currentUser.relationship || [],
          values: currentUser.values || [],
          communication: currentUser.communication || [],
          lifestyle: currentUser.lifestyle || [],
          hobbies: currentUser.hobbies || [],
          interests: currentUser.interests || [],
      });
    }
  }, [currentUser]);

  if (isLoaded && !currentUser) {
      return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!currentUser) {
      return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  const photoUrls = currentUser.photoUrls || [];
  const videoUrls = currentUser.videoUrls || [];
  
  const handleMultiSelect = (field: keyof typeof profile, value: string) => {
    setProfile(prev => {
        const currentValues = prev[field] as string[];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        return { ...prev, [field]: newValues };
    });
  };

  const handleSingleSelect = (field: 'gender' | 'language', value: any) => {
    setProfile(prev => ({...prev, [field]: value}));
    if (field === 'language') {
      setLanguage(value);
    }
  }

  const handleSave = () => {
    if (isEnhancing || isGeneratingVideo) {
        toast({
            variant: "destructive",
            title: t('ai_enhancing_toast_title'),
            description: t('ai_enhancing_toast_desc'),
        });
        return;
    }
    setIsSaving(true);
    
    updateUser({
        ...profile,
        age: parseInt(profile.age) || currentUser.age,
    }).then(() => {
        toast({
          title: t('profile_updated_title'),
          description: t('profile_updated_desc'),
        });
        router.push('/profile');
    }).catch((error) => {
        console.error("Failed to update profile:", error);
        toast({
          variant: "destructive",
          title: t('profile_update_failed_title'),
          description: t('profile_update_failed_desc')
        });
    }).finally(() => {
        setIsSaving(false);
    });
  };

  const processAndAddImage = async (dataUri: string) => {
    const compressedForUpload = await compressImage(dataUri);
    setTempPhotoUri(compressedForUpload);
    setIsEnhancing(true);

    let finalUriToUpload = compressedForUpload;

    if (aiEnhancement) {
        try {
            const result = await getEnhancedPhoto({ photoDataUri: compressedForUpload, gender: profile.gender });
            finalUriToUpload = await compressImage(result.enhancedPhotoDataUri);
        } catch (error: any) {
            console.error("AI photo enhancement failed:", error);
            toast({
                variant: "destructive",
                title: t('ai_enhance_failed_title'),
                description: t('ai_enhance_failed_desc'),
            });
        }
    }
    
    try {
        await updateUser({ photoUrls: [...photoUrls, finalUriToUpload] });
    } catch (error) {
        console.error("Failed to update user with new photo:", error);
        toast({
          variant: "destructive",
          title: t('photo_add_failed_title'),
          description: t('photo_add_failed_desc'),
        });
    } finally {
        setIsEnhancing(false);
        setTempPhotoUri(null);
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setIsPhotoSourceDialogOpen(false);
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          processAndAddImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      event.target.value = ''; // Reset file input
    }
  };

  const handlePhotoTaken = (dataUri: string) => {
    setIsCameraDialogOpen(false);
    processAndAddImage(dataUri);
  };
  
  const removeImage = (urlToRemove: string) => {
    const newPhotoUrls = photoUrls.filter(url => url !== urlToRemove);
    updateUser({ photoUrls: newPhotoUrls });
  }

  const handleDeleteAccount = async () => {
    if (!authUser || !firestore) return;
  
    try {
      await deleteUser(authUser);
      const userDocRef = doc(firestore, 'users', authUser.uid);
      await deleteDoc(userDocRef);
  
      toast({
        title: t('account_deleted_message'),
        description: t('delete_account_confirm_description'),
      });
      router.push('/signup');
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      if (error.code === 'auth/requires-recent-login') {
        setIsReauthDialogOpen(true);
      } else {
        toast({
          variant: "destructive",
          title: t('delete_account_error'),
          description: error.message,
        });
      }
    }
  };

  const handleGenerateVideo = async () => {
    if (!selectedPhotoForVideo) {
        toast({ title: "동영상을 만들 사진을 선택해주세요.", variant: "destructive" });
        return;
    }
    if (!videoPrompt.trim()) {
        toast({ title: "프롬프트를 입력해주세요.", variant: "destructive" });
        return;
    }
    setIsGeneratingVideo(true);
    try {
        const { videoDataUri } = await generateAnimatedPhoto({
            photoDataUri: selectedPhotoForVideo,
            prompt: videoPrompt
        });
        await updateUser({ videoUrls: [...videoUrls, videoDataUri] });
        toast({ title: "동영상 생성 완료!", description: "프로필에 동영상이 추가되었습니다." });
        setIsAnimateVideoDialogOpen(false);
        setSelectedPhotoForVideo(null);
        setVideoPrompt('');
    } catch (error: any) {
        toast({ title: "동영상 생성 실패", description: error.message, variant: "destructive" });
    } finally {
        setIsGeneratingVideo(false);
    }
  }

  const removeVideo = (urlToRemove: string) => {
    const newVideoUrls = videoUrls.filter(url => url !== urlToRemove);
    updateUser({ videoUrls: newVideoUrls });
  }

  return (
    <>
      <main className="container px-4 pb-40">
        <Section title={t('photo_video_section_title')}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm">{t('ai_enhancement')}</span>
            <Switch checked={aiEnhancement} onCheckedChange={setAiEnhancement} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {photoUrls.map((url, index) => (
              <div key={url + index} className="relative aspect-square rounded-lg overflow-hidden group bg-zinc-900">
                <Image src={url} alt={`My profile photo`} fill className="object-cover"/>
                <div className="absolute top-1 right-1 z-20">
                  <Button variant="destructive" size="icon" onClick={() => removeImage(url)} className="w-6 h-6 rounded-full bg-black/50">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {tempPhotoUri && (
                <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-900">
                    <Image src={tempPhotoUri} alt="Uploading..." fill className="object-cover" />
                    {isEnhancing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                            <Loader2 className="animate-spin text-primary" />
                        </div>
                    )}
                </div>
            )}

            {photoUrls.length < 9 && !tempPhotoUri &&(
              <Dialog open={isPhotoSourceDialogOpen} onOpenChange={setIsPhotoSourceDialogOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center justify-center aspect-square rounded-lg border-2 border-dashed border-zinc-700" disabled={isEnhancing}>
                    <Plus className="text-zinc-500" />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-card border-primary/20">
                  <DialogHeader>
                    <DialogTitle>{t('add_photo')}</DialogTitle>
                    <DialogDescription>
                      {t('add_photo_dialog_desc')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Button variant="outline" onClick={() => { setIsCameraDialogOpen(true); setIsPhotoSourceDialogOpen(false); }}>
                      <Camera className="mr-2 h-4 w-4" />
                      {t('take_photo')}
                    </Button>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      {t('from_album')}
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*,image/heic,image/heif"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
           <Button variant="outline" className="w-full mt-4 bg-zinc-800 border-zinc-700 hover:bg-zinc-700" onClick={() => setIsAnimateVideoDialogOpen(true)}>
            <Video className="mr-2 h-4 w-4" />
            {t('video_add_button')}
          </Button>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {videoUrls.map((url, index) => (
                <div key={url + index} className="relative aspect-square rounded-lg overflow-hidden group bg-zinc-900">
                    <video src={url} className="object-cover w-full h-full" controls loop />
                    <div className="absolute top-1 right-1 z-20">
                    <Button variant="destructive" size="icon" onClick={() => removeVideo(url)} className="w-6 h-6 rounded-full bg-black/50">
                        <X className="h-4 w-4" />
                    </Button>
                    </div>
                </div>
            ))}
            </div>
        </Section>
        
        <CameraDialog isOpen={isCameraDialogOpen} onClose={() => setIsCameraDialogOpen(false)} onPhotoTaken={handlePhotoTaken} />

        <Section title={t('language_section_title')} description={t('language_section_description')}>
          <Select value={profile.language} onValueChange={(value: LanguageCode) => handleSingleSelect('language', value)}>
            <SelectTrigger className="w-full bg-zinc-900 border-zinc-800">
                <SelectValue>
                  {profile.language ? (
                    <div className="flex items-center gap-2">
                      <FlagIcon code={profile.language} className="w-5 h-auto rounded-sm" />
                      <span>{supportedLanguages.find(l => l.code === profile.language)?.name}</span>
                    </div>
                  ) : (
                    "언어 선택"
                  )}
                </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 text-white border-zinc-800">
              {supportedLanguages.map(lang => (
                <SelectItem key={lang.code} value={lang.code}>
                  <div className="flex items-center gap-2">
                    <FlagIcon code={lang.code} className="w-5 h-auto rounded-sm" />
                    <span>{lang.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Section>

        <Section title={t('name_section_title')}>
          <Input 
            value={profile.name} 
            onChange={e => setProfile(p => ({...p, name: e.target.value}))}
            className="bg-zinc-900 border-zinc-800" />
        </Section>

        <Section title={t('age_section_title')}>
          <Input 
            type="number"
            value={profile.age} 
            onChange={e => setProfile(p => ({...p, age: e.target.value}))}
            className="bg-zinc-900 border-zinc-800" />
        </Section>
        
        <Section title={t('gender_section_title')}>
            <div className="flex space-x-2">
                {[
                    { label: t('gender_male'), value: '남성' },
                    { label: t('gender_female'), value: '여성' },
                    { label: t('gender_other'), value: '기타' }
                ].map(gender => (
                    <TagButton 
                        key={gender.value} 
                        label={gender.label}
                        isSelected={profile.gender === gender.value} 
                        onClick={() => handleSingleSelect('gender', gender.value as '남성' | '여성' | '기타')}
                    />
                ))}
            </div>
        </Section>
        
        <Section title={t('city_section_title')}>
            <Input 
                value={profile.location} 
                onChange={e => setProfile(p => ({...p, location: e.target.value}))}
                className="bg-zinc-900 border-zinc-800" />
        </Section>

        <Section title={t('bio_section_title')}>
          <Textarea 
            value={profile.bio} 
            onChange={e => setProfile(p => ({...p, bio: e.target.value}))}
            placeholder={t('bio_placeholder')}
            className="bg-zinc-900 border-zinc-800 h-24" />
        </Section>
        
        {Object.entries(allValueKeys).map(([key, value]) => (
            <Section key={key} title={t(`${key}_section_title` as TranslationKeys)} description={t('multiple_selection_description')}>
                <div className="flex flex-wrap gap-2">
                    {value.map(itemKey => (
                        <TagButton 
                            key={itemKey}
                            label={t(itemKey as TranslationKeys)}
                            isSelected={(profile[key as keyof typeof profile] as string[]).includes(itemKey)}
                            onClick={() => handleMultiSelect(key as keyof typeof profile, itemKey)}
                        />
                    ))}
                </div>
            </Section>
        ))}

      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-sm border-t border-zinc-800">
        <div className="flex w-full gap-2 max-w-screen-sm mx-auto">
            <Button variant="secondary" onClick={() => router.back()} className="flex-1 h-12 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg">{t('cancel_button')}</Button>
            <Button onClick={handleSave} disabled={isSaving || isEnhancing || isGeneratingVideo} className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg">
                {(isSaving || isEnhancing || isGeneratingVideo) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('save_button')}
            </Button>
        </div>
        <div className="text-center mt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="link" className="text-xs text-zinc-500">{t('delete_account_button')}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('delete_account_confirm_title')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('delete_account_confirm_description')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel_button')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className={cn(buttonVariants({ variant: "destructive" }))}>
                    {t('delete_account_button')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </footer>

      {isReauthDialogOpen && (
        <ReauthDialog
          isOpen={isReauthDialogOpen}
          onClose={() => setIsReauthDialogOpen(false)}
          onReauthSuccess={handleDeleteAccount}
        />
      )}
      <Dialog open={isAnimateVideoDialogOpen} onOpenChange={setIsAnimateVideoDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>프로필 동영상 생성</DialogTitle>
                <DialogDescription>
                    프로필 사진 중 하나를 선택하고, 어떤 움직임을 원하는지 설명해주세요. AI가 5초 분량의 동영상을 생성합니다. (예: 머리카락이 바람에 날리는 모습, 부드럽게 미소짓는 모습)
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div>
                    <Label>1. 동영상으로 만들 사진 선택</Label>
                    <ScrollArea className="h-48 mt-2">
                        <div className="grid grid-cols-4 gap-2 pr-4">
                            {photoUrls.map((url) => (
                                <div key={url} className="relative aspect-square rounded-md overflow-hidden cursor-pointer" onClick={() => setSelectedPhotoForVideo(url)}>
                                    <Image src={url} alt="photo" fill className="object-cover"/>
                                    {selectedPhotoForVideo === url && (
                                        <div className="absolute inset-0 border-4 border-primary rounded-md flex items-center justify-center bg-black/50">
                                            <Check className="h-8 w-8 text-white"/>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
                <div>
                    <Label htmlFor="video-prompt">2. 원하는 움직임 설명 (프롬프트)</Label>
                    <Textarea 
                        id="video-prompt"
                        value={videoPrompt}
                        onChange={(e) => setVideoPrompt(e.target.value)}
                        placeholder="예: 부드럽게 미소지으며 머리카락이 바람에 날리는 모습"
                        className="mt-2"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="secondary" onClick={() => setIsAnimateVideoDialogOpen(false)}>취소</Button>
                <Button onClick={handleGenerateVideo} disabled={isGeneratingVideo || !selectedPhotoForVideo || !videoPrompt.trim()}>
                    {isGeneratingVideo ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    생성하기
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
