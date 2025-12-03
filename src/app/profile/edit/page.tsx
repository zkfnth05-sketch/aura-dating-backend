'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { currentUser } from '@/lib/data';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { X, Plus, Video, Camera, ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import CameraDialog from '@/components/camera-dialog';
import { getEnhancedPhoto } from '@/app/actions/ai-actions';

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

export default function ProfileEditPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState({
    name: currentUser.name,
    age: currentUser.age.toString(),
    city: currentUser.location.split(',')[0],
    bio: currentUser.bio,
    gender: '여성' as '남성' | '여성' | '기타',
    relationship: ['새로운 친구'],
    values: ['모험', '성장'],
    communication: ['진솔함', '따뜻함'],
    lifestyle: ['활동적', '탐험가'],
    hobbies: currentUser.hobbies,
    interests: currentUser.interests,
  });

  const [images, setImages] = useState<string[]>([currentUser.photoUrl]);
  const [aiEnhancement, setAiEnhancement] = useState(true);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState<number | null>(null);


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
    toast({
      title: "프로필 저장됨",
      description: "프로필이 성공적으로 업데이트되었습니다.",
    });
    router.push('/profile');
  };

  const processAndAddImage = async (dataUri: string) => {
    const newImageIndex = images.length;
    setImages(prev => [...prev, dataUri]);

    if (aiEnhancement) {
      setIsEnhancing(newImageIndex);
      try {
        const result = await getEnhancedPhoto({ photoDataUri: dataUri });
        setImages(prev => {
          const newImages = [...prev];
          newImages[newImageIndex] = result.enhancedPhotoDataUri;
          return newImages;
        });
      } catch (error) {
        console.error("AI enhancement failed:", error);
        toast({
          variant: "destructive",
          title: "AI 보정 실패",
          description: "사진을 보정하는 데 실패했습니다. 원본 사진이 사용됩니다.",
        });
      } finally {
        setIsEnhancing(null);
      }
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          processAndAddImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoTaken = (dataUri: string) => {
    setIsCameraDialogOpen(false);
    processAndAddImage(dataUri);
  };
  
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-10 p-4 bg-black/80 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-center">프로필 수정</h1>
      </header>

      <main className="container pb-24 px-4">
        <Section title="사진 및 동영상">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm">AI 보정</span>
            <Switch checked={aiEnhancement} onCheckedChange={setAiEnhancement} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {images.map((src, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden group bg-zinc-900">
                <Image src={src} alt={`My profile photo ${index + 1}`} fill className="object-cover"/>
                {isEnhancing === index && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
                <div className="absolute top-1 right-1">
                  <Button variant="destructive" size="icon" onClick={() => removeImage(index)} className="w-6 h-6 rounded-full bg-black/50">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            <Dialog>
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
                  <Button variant="outline" onClick={() => setIsCameraDialogOpen(true)}>
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
                value={profile.city} 
                onChange={e => setProfile(p => ({...p, city: e.target.value}))}
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
        <div className="container flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.back()}>취소</Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8">저장</Button>
        </div>
        <div className="text-center mt-4">
            <Button variant="link" className="text-xs text-zinc-500">회원탈퇴</Button>
        </div>
      </footer>
    </div>
  );
}
