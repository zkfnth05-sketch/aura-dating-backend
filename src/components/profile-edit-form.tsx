'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
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
import { getEnhancedPhoto } from '@/app/actions/ai-actions';
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


type Photo = {
  id: string;
  dataUri: string;
  isEnhancing: boolean;
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

const allValues = {
  relationship: ['진지한 관계', '가벼운 만남', '새로운 친구', '대화 상대'],
  values: ['모험', '안정', '창의성', '성장', '진정성', '열정', '평온함', '유머'],
  communication: ['깊은 대화', '유머러스', '진솔함', '따뜻함', '직설적'],
  lifestyle: ['활동적', '집순이', '예술가', '웰빙', '탐험가', '미니멀리스트'],
  hobbies: ['영화 감상', '음악 듣기', '운동', '요리', '독서', '여행', '게임', '캠핑', '수채화', '베이킹', '코딩', '피아노 연주', '스쿠버 다이빙', '명상'],
  interests: ['맛집 탐방', '카페 투어', '사진 촬영', '패션', '뷰티', '재테크', '자기계발', '그림 그리기', '독서', '등산', '클래식 음악', '요가']
};

export default function ProfileEditForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser, updateUser, isLoaded, authUser } = useUser();
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    location: '',
    bio: '',
    gender: '여성' as '남성' | '여성' | '기타',
    relationship: [] as string[],
    values: [] as string[],
    communication: [] as string[],
    lifestyle: [] as string[],
    hobbies: [] as string[],
    interests: [] as string[],
  });

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const [aiEnhancement, setAiEnhancement] = useState(true);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [isPhotoSourceDialogOpen, setIsPhotoSourceDialogOpen] = useState(false);
  const [isReauthDialogOpen, setIsReauthDialogOpen] = useState(false);


  useEffect(() => {
    // Pre-fill form only if currentUser is available
    if (currentUser) {
      setProfile({
          name: currentUser.name || '',
          age: currentUser.age?.toString() || '',
          location: currentUser.location || '',
          bio: currentUser.bio || '',
          gender: currentUser.gender || '여성',
          relationship: currentUser.relationship || [],
          values: currentUser.values || [],
          communication: currentUser.communication || [],
          lifestyle: currentUser.lifestyle || [],
          hobbies: currentUser.hobbies || [],
          interests: currentUser.interests || [],
      });
      setPhotos(
        (currentUser.photoUrls || []).map((url, i) => ({
          id: `ctx-photo-${i}-${Date.now()}`,
          dataUri: url,
          isEnhancing: false,
        }))
      );
    }
  }, [currentUser]); // Depend only on currentUser

  // Show loader only if the context is loading AND we have no user data yet.
  if (isLoaded && !currentUser) {
      return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  // If there's no user data at all after loading, we can't edit.
  // This might happen if the user navigates here directly without being logged in.
  if (!currentUser) {
      return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  const isEnhancing = photos.some(p => p.isEnhancing);

  const handleMultiSelect = (field: keyof typeof profile, value: string) => {
    setProfile(prev => {
        const currentValues = prev[field] as string[];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        return { ...prev, [field]: newValues };
    });
  };

  const handleSingleSelect = (field: 'gender', value: '남성' | '여성' | '기타') => {
    setProfile(prev => ({...prev, [field]: value}));
  }

  const handleSave = () => {
    if (isEnhancing) {
        toast({
            variant: "destructive",
            title: "AI 보정 중",
            description: "사진 보정이 완료될 때까지 기다려주세요.",
        });
        return;
    }
    setIsSaving(true);
    const finalImageUris = photos.map(p => p.dataUri);
    
    // Non-blocking update
    updateUser({
        ...profile,
        age: parseInt(profile.age) || currentUser.age,
        photoUrls: finalImageUris,
    }).catch((error) => {
        // Still handle errors in the background
        console.error("Failed to update profile:", error);
        toast({
          variant: "destructive",
          title: "업데이트 실패",
          description: "프로필을 업데이트하는 데 실패했습니다. 다시 시도해주세요."
        });
        setIsSaving(false); // Re-enable button on error
    });
    
    // Optimistic UI update and navigation
    toast({
      title: "프로필 저장됨",
      description: "프로필이 성공적으로 업데이트되었습니다.",
    });
    router.push('/profile');
  };

  const processAndAddImage = async (dataUri: string) => {
    const newPhotoId = `new-photo-${Date.now()}`;
    const compressedUri = await compressImage(dataUri);

    if (aiEnhancement) {
      setPhotos(prev => [...prev, { id: newPhotoId, dataUri: compressedUri, isEnhancing: true }]);
      try {
        const result = await getEnhancedPhoto({ photoDataUri: compressedUri, gender: profile.gender });
        const finalCompressedUri = await compressImage(result.enhancedPhotoDataUri);
        setPhotos(prev => prev.map(p => p.id === newPhotoId ? { ...p, dataUri: finalCompressedUri, isEnhancing: false } : p));
      } catch (error) {
        console.error("AI enhancement failed:", error);
        toast({
          variant: "destructive",
          title: "AI 보정 실패",
          description: "사진을 보정하는 데 실패했습니다. 원본 사진이 사용됩니다.",
        });
        setPhotos(prev => prev.map(p => p.id === newPhotoId ? { ...p, isEnhancing: false } : p)); // Keep original, stop loading
      }
    } else {
        setPhotos(prev => [...prev, { id: newPhotoId, dataUri: compressedUri, isEnhancing: false }]);
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
  
  const removeImage = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  }

  const handleDeleteAccount = async () => {
    if (!authUser || !firestore) return;
  
    try {
      // 1. Delete user document from Firestore
      const userDocRef = doc(firestore, 'users', authUser.uid);
      await deleteDoc(userDocRef);
  
      // 2. Delete user from Firebase Authentication
      await deleteUser(authUser);
  
      toast({
        title: "계정이 삭제되었습니다.",
        description: "이용해주셔서 감사합니다.",
      });
      router.push('/signup');
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      toast({
        variant: "destructive",
        title: "오류",
        description: "계정 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      });
    }
  };

  return (
    <>
      <main className="container px-4">
        <Section title="사진 및 동영상">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm">AI 보정</span>
            <Switch checked={aiEnhancement} onCheckedChange={setAiEnhancement} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden group bg-zinc-900">
                {photo.dataUri && <Image src={photo.dataUri} alt={`My profile photo`} fill className="object-cover"/>}
                {photo.isEnhancing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
                {!photo.isEnhancing && (
                  <div className="absolute top-1 right-1 z-20">
                    <Button variant="destructive" size="icon" onClick={() => removeImage(photo.id)} className="w-6 h-6 rounded-full bg-black/50">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
            
            <Dialog open={isPhotoSourceDialogOpen} onOpenChange={setIsPhotoSourceDialogOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center justify-center aspect-square rounded-lg border-2 border-dashed border-zinc-700">
                  <Plus className="text-zinc-500" />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card border-primary/20">
                <DialogHeader>
                  <DialogTitle>사진 추가</DialogTitle>
                  <DialogDescription>
                    프로필에 사진을 추가하는 방법을 선택하세요.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Button variant="outline" onClick={() => { setIsCameraDialogOpen(true); setIsPhotoSourceDialogOpen(false); }}>
                    <Camera className="mr-2 h-4 w-4" />
                    사진 촬영
                  </Button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    앨범에서 선택
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

          </div>
           <Button variant="outline" className="w-full mt-4 bg-zinc-800 border-zinc-700 hover:bg-zinc-700">
            <Video className="mr-2 h-4 w-4" />
            동영상 추가
          </Button>
        </Section>
        
        <CameraDialog isOpen={isCameraDialogOpen} onClose={() => setIsCameraDialogOpen(false)} onPhotoTaken={handlePhotoTaken} />

        <Section title="이름">
          <Input 
            value={profile.name} 
            onChange={e => setProfile(p => ({...p, name: e.target.value}))}
            className="bg-zinc-900 border-zinc-800" />
        </Section>

        <Section title="나이">
          <Input 
            type="number"
            value={profile.age} 
            onChange={e => setProfile(p => ({...p, age: e.target.value}))}
            className="bg-zinc-900 border-zinc-800" />
        </Section>
        
        <Section title="성별">
            <div className="flex space-x-2">
                {['남성', '여성', '기타'].map(gender => (
                    <TagButton 
                        key={gender} 
                        label={gender}
                        isSelected={profile.gender === gender} 
                        onClick={() => handleSingleSelect('gender', gender as '남성' | '여성' | '기타')}
                    />
                ))}
            </div>
        </Section>
        
        <Section title="도시">
            <Input 
                value={profile.location} 
                onChange={e => setProfile(p => ({...p, location: e.target.value}))}
                className="bg-zinc-900 border-zinc-800" />
        </Section>

        <Section title="소개">
          <Textarea 
            value={profile.bio} 
            onChange={e => setProfile(p => ({...p, bio: e.target.value}))}
            placeholder="새로운 연결을 찾고 모험을 시작할 준비가 되었습니다. 제 소개를 편집하여 개성을 표현해보세요!"
            className="bg-zinc-900 border-zinc-800 h-24" />
        </Section>
        
        <Section title="찾는 관계">
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
            '가치관': 'values', 
            '소통 스타일': 'communication',
            '라이프스타일': 'lifestyle',
            '취미': 'hobbies',
            '관심사': 'interests'
        }).map(([title, key]) => (
            <Section key={key} title={title} description="여러 개 선택">
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
            <Button variant="secondary" onClick={() => router.back()} className="flex-1 h-12 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg">취소</Button>
            <Button onClick={handleSave} disabled={isSaving || isEnhancing} className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg">
                {(isSaving || isEnhancing) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                저장
            </Button>
        </div>
        <div className="text-center mt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="link" className="text-xs text-zinc-500">회원 탈퇴</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>정말로 탈퇴하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    이 작업은 되돌릴 수 없습니다. 모든 프로필 정보와 매칭 데이터가 영구적으로 삭제됩니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={() => setIsReauthDialogOpen(true)} className={cn(buttonVariants({ variant: "destructive" }))}>
                    회원 탈퇴
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
