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
import { X, Plus, Video, Camera, ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn, compressImage } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import CameraDialog from '@/components/camera-dialog';
import { getEnhancedPhoto } from '@/actions/ai-actions';
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

const FlagIcon = ({ code, ...props }: { code: string } & React.SVGProps<SVGSVGElement>) => {
  switch (code) {
    case 'ko':
        return <svg viewBox="0 0 900 600" {...props}><path fill="#fff" d="M0 0h900v600H0z"/><g transform="translate(450 300)"><circle r="150" fill="#cd2e3a"/><path d="M0-150a150 150 0 0 0 0 300 75 75 0 0 1 0-150Z" fill="#0047a0"/></g><g fill="#000"><g transform="translate(193.2 143.2)rotate(33.69)"><path d="M-75-25h150v16.7h-150zm0 25h150v16.7h-150zm0 25h150v16.7h-150z"/></g><g transform="translate(193.2 456.8)rotate(-33.69)"><path d="M-75-25h150v16.7h-150zm0 25h50v16.7h-50zm100 0h50v16.7h-50zm-100 25h150v16.7h-150z"/></g><g transform="translate(706.8 143.2)rotate(-33.69)"><path d="M-75-25h50v16.7h-50zm100 0h50v16.7h-50zm-100 25h150v16.7h-150zm0 25h50v16.7h-50zm100 0h50v16.7h-50z"/></g><g transform="translate(706.8 456.8)rotate(33.69)"><path d="M-75-25h150v16.7h-150zm0 25h150v16.7h-150zm0 25h150v16.7h-150z"/></g></g></svg>;
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

  const allValues = useMemo(() => ({
    relationship: [t('relationship_section_title_serious'), t('relationship_section_title_casual'), t('relationship_section_title_friends'), t('relationship_section_title_chat')],
    values: [t('values_section_title_adventure'), t('values_section_title_stability'), t('values_section_title_creativity'), t('values_section_title_growth'), t('values_section_title_authenticity'), t('values_section_title_passion'), t('values_section_title_calmness'), t('values_section_title_humor')],
    communication: [t('communication_section_title_deep'), t('communication_section_title_witty'), t('communication_section_title_sincere'), t('communication_section_title_warm'), t('communication_section_title_direct')],
    lifestyle: [t('lifestyle_section_title_active'), t('lifestyle_section_title_homebody'), t('lifestyle_section_title_artist'), t('lifestyle_section_title_wellness'), t('lifestyle_section_title_explorer'), t('lifestyle_section_title_minimalist')],
    hobbies: [t('hobbies_section_title_movies'), t('hobbies_section_title_music'), t('hobbies_section_title_exercise'), t('hobbies_section_title_cooking'), t('hobbies_section_title_reading'), t('hobbies_section_title_travel'), t('hobbies_section_title_games'), t('hobbies_section_title_camping'), t('hobbies_section_title_watercolor'), t('hobbies_section_title_baking'), t('hobbies_section_title_coding'), t('hobbies_section_title_piano'), t('hobbies_section_title_scuba'), t('hobbies_section_title_meditation')],
    interests: [t('interests_section_title_foodie'), t('interests_section_title_cafe'), t('interests_section_title_photo'), t('interests_section_title_fashion'), t('interests_section_title_beauty'), t('interests_section_title_finance'), t('interests_section_title_self_dev'), t('interests_section_title_drawing'), t('interests_section_title_reading'), t('interests_section_title_hiking'), t('interests_section_title_classical'), t('interests_section_title_yoga')]
  }), [t]);

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
    if (isEnhancing) {
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
      // Step 1: Try deleting the user from Firebase Auth
      await deleteUser(authUser);
  
      // Step 2: If successful, delete the user document from Firestore
      const userDocRef = doc(firestore, 'users', authUser.uid);
      await deleteDoc(userDocRef);
  
      toast({
        title: "계정이 삭제되었습니다.",
        description: "이용해주셔서 감사합니다.",
      });
      router.push('/signup');
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      if (error.code === 'auth/requires-recent-login') {
        // If re-authentication is required, open the dialog.
        // The dialog will re-call this function upon success.
        setIsReauthDialogOpen(true);
      } else {
        toast({
          variant: "destructive",
          title: "오류",
          description: "계정 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        });
      }
    }
  };

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
           <Button variant="outline" className="w-full mt-4 bg-zinc-800 border-zinc-700 hover:bg-zinc-700">
            <Video className="mr-2 h-4 w-4" />
            {t('video_add_button')}
          </Button>
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
        
        <Section title={t('relationship_section_title')}>
            <div className="flex flex-wrap gap-2">
                {allValues.relationship.map(item => (
                    <TagButton 
                        key={item}
                        label={item}
                        isSelected={(profile.relationship as string[]).includes(item)}
                        onClick={() => handleMultiSelect('relationship', item)}
                    />
                ))}
            </div>
        </Section>

        {Object.entries({
            'values_section_title': 'values', 
            'communication_section_title': 'communication',
            'lifestyle_section_title': 'lifestyle',
            'hobbies_section_title': 'hobbies',
            'interests_section_title': 'interests'
        }).map(([titleKey, key]) => (
            <Section key={key} title={t(titleKey as TranslationKeys)} description={t('multiple_selection_description')}>
                <div className="flex flex-wrap gap-2">
                    {allValues[key as keyof typeof allValues].map(item => (
                        <TagButton 
                            key={item}
                            label={item}
                            isSelected={(profile[key as keyof typeof profile] as string[]).includes(item)}
                            onClick={() => handleMultiSelect(key as keyof typeof profile, item)}
                        />
                    ))}
                </div>
            </Section>
        ))}

      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-sm border-t border-zinc-800">
        <div className="flex w-full gap-2">
            <Button variant="secondary" onClick={() => router.back()} className="flex-1 h-12 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg">{t('cancel_button')}</Button>
            <Button onClick={handleSave} disabled={isSaving || isEnhancing} className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg">
                {(isSaving || isEnhancing) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
    </>
  );
}
