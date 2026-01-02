'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUser } from '@/contexts/user-context';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Plus, Loader2, Camera, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getEnhancedPhoto } from '@/app/actions/ai-actions';
import { compressImage } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import CameraDialog from '@/components/camera-dialog';

type PhotoState = {
  uri: string | null;
  isEnhancing: boolean;
};

export default function UploadPhotoPage() {
  const router = useRouter();
  const { user, updateUser, isLoaded, authUser, setIsSignupFlowActive } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<PhotoState>({ uri: null, isEnhancing: false });
  const [aiEnhancement, setAiEnhancement] = useState(true);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [isPhotoSourceDialogOpen, setIsPhotoSourceDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // This is a protected route.
    if (isLoaded) {
      if (!authUser) {
        // Not authenticated, should be on the initial signup page.
        router.replace('/signup');
      } else if (!user) {
        // Authenticated but no profile, should be creating profile first.
        router.replace('/signup/profile');
      }
    }
  }, [isLoaded, authUser, user, router]);

  const processAndAddImage = async (dataUri: string) => {
    const newPhotoId = `new-photo-${Date.now()}`;
    if (aiEnhancement) {
        setPhoto({ uri: dataUri, isEnhancing: true });
        try {
            const result = await getEnhancedPhoto({ photoDataUri: dataUri, gender: user?.gender || '기타' });
            const finalCompressedUri = await compressImage(result.enhancedPhotoDataUri);
            setPhoto({ uri: finalCompressedUri, isEnhancing: false });
        } catch (error) {
            console.error("AI enhancement failed, using original compressed image:", error);
            toast({
                variant: "destructive",
                title: "AI 보정 실패",
                description: "AI 보정에 실패했습니다. 원본 사진이 대신 사용됩니다.",
            });
            const compressedOriginal = await compressImage(dataUri);
            setPhoto({ uri: compressedOriginal, isEnhancing: false });
        }
    } else {
        const compressedUri = await compressImage(dataUri);
        setPhoto({ uri: compressedUri, isEnhancing: false });
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

  const handleComplete = async () => {
    if (!photo.uri) {
      toast({
        variant: "destructive",
        title: "사진 필요",
        description: "프로필 사진을 등록해주세요.",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await updateUser({
        photoUrls: [photo.uri],
      });
      setIsSignupFlowActive(false); // Signal that the signup flow is now complete
      router.push('/profile/edit');
    } catch (error) {
      console.error("Failed to complete signup:", error);
      toast({
        variant: "destructive",
        title: "등록 실패",
        description: "프로필을 완성하는 데 실패했습니다. 다시 시도해주세요."
      });
      setIsSubmitting(false); // Re-enable button on error
    }
  };
  
  // While auth state is loading, or user data is missing show a loader to prevent flicker or incorrect redirects.
  if (!isLoaded || !user) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }


  return (
    <>
    <div className="flex flex-col min-h-screen bg-black text-white px-8 py-12">
      <header className="flex-shrink-0">
        <h1 className="text-2xl font-bold text-center">프로필 만들기</h1>
        <Progress value={75} className="w-full mt-4 h-1 bg-zinc-800" />
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center mt-8">
        <p className="text-zinc-400 mb-6">대표 사진을 등록해주세요.</p>
        
        <Dialog open={isPhotoSourceDialogOpen} onOpenChange={setIsPhotoSourceDialogOpen}>
          <DialogTrigger asChild>
            <div
              className="relative w-48 h-48 flex items-center justify-center border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer bg-zinc-900/50"
            >
              {photo.uri ? (
                <Image src={photo.uri} alt="Profile preview" layout="fill" className="object-cover rounded-lg" />
              ) : (
                <Plus className="w-10 h-10 text-zinc-500" />
              )}
               {photo.isEnhancing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
              )}
            </div>
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
            disabled={isSubmitting || photo.isEnhancing}
        >
            이전
        </Button>
        <Button
          onClick={handleComplete}
          disabled={!photo.uri || photo.isEnhancing || isSubmitting}
          className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-full text-lg hover:bg-primary/90 disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          {(photo.isEnhancing || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          완료
        </Button>
      </footer>
    </div>
    <CameraDialog isOpen={isCameraDialogOpen} onClose={() => setIsCameraDialogOpen(false)} onPhotoTaken={handlePhotoTaken} />
    </>
  );
}
