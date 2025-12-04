'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUser } from '@/contexts/user-context';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getEnhancedPhoto } from '@/app/actions/ai-actions';
import { compressImage } from '@/lib/utils';


export default function UploadPhotoPage() {
  const router = useRouter();
  const { user, updateUser, isLoaded, authUser } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [aiEnhancement, setAiEnhancement] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoaded && !authUser) {
      router.replace('/signup');
    }
  }, [isLoaded, authUser, router]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          setIsLoading(true);
          const dataUri = e.target.result as string;
          const compressedUri = await compressImage(dataUri);
          
          if (aiEnhancement) {
            try {
              const result = await getEnhancedPhoto({ photoDataUri: compressedUri, gender: user?.gender || '기타' });
              const finalCompressedUri = await compressImage(result.enhancedPhotoDataUri);
              setPhoto(finalCompressedUri);
            } catch (error) {
              console.error("AI enhancement failed:", error);
              toast({
                variant: "destructive",
                title: "AI 보정 실패",
                description: "사진 보정에 실패했습니다. 원본 사진으로 등록됩니다.",
              });
              setPhoto(compressedUri);
            } finally {
              setIsLoading(false);
            }
          } else {
            setPhoto(compressedUri);
            setIsLoading(false);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleComplete = async () => {
    if (!photo) {
      return;
    }

    await updateUser({
      photoUrl: photo,
      photoUrls: [photo],
    });

    router.push('/profile');
  };
  
  if (!isLoaded || !authUser) {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white px-8 py-12">
      <header className="flex-shrink-0">
        <h1 className="text-2xl font-bold text-center">프로필 만들기</h1>
        <Progress value={75} className="w-full mt-4 h-1 bg-zinc-800" />
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center mt-8">
        <p className="text-zinc-400 mb-6">대표 사진을 등록해주세요.</p>

        <div
          className="relative w-48 h-48 flex items-center justify-center border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer bg-zinc-900/50"
          onClick={() => fileInputRef.current?.click()}
        >
          {isLoading ? (
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          ) : photo ? (
            <Image src={photo} alt="Profile preview" layout="fill" className="object-cover rounded-lg" />
          ) : (
            <Plus className="w-10 h-10 text-zinc-500" />
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </div>

        <div className="flex items-center justify-center gap-4 mt-8">
          <label htmlFor="ai-enhancement" className="text-sm font-medium text-zinc-400">
            AI 보정
          </label>
          <Switch
            id="ai-enhancement"
            checked={aiEnhancement}
            onCheckedChange={setAiEnhancement}
          />
        </div>
      </main>

      <footer className="flex-shrink-0 mt-8 flex gap-3">
        <Button
            onClick={() => router.back()}
            className="w-full h-14 bg-zinc-800 text-zinc-300 font-bold rounded-full text-lg hover:bg-zinc-700"
        >
            이전
        </Button>
        <Button
          onClick={handleComplete}
          disabled={!photo || isLoading}
          className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-full text-lg hover:bg-primary/90 disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          완료
        </Button>
      </footer>
    </div>
  );
}
