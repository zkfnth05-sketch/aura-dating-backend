'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { User } from '@/lib/types';

export default function CreateProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, updateUser, authUser, isLoaded, isSignupFlowActive } = useUser();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState<'여성' | '남성' | '기타'>('여성');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // This is a protected route. If auth state is loaded and there's no authenticated user,
    // redirect to the start of the signup flow.
    if (isLoaded && !authUser) {
      router.replace('/signup');
      return;
    }
    
    // If the user profile ALREADY exists and we are NOT in an active signup flow,
    // it means they have completed signup. Send them to the main app.
    if (isLoaded && authUser && user && !isSignupFlowActive) {
        router.replace('/');
        return;
    }

    // Pre-fill form if authUser exists (they've passed OTP) but no full profile yet.
    if (authUser) {
      setName(prev => prev || authUser.displayName || '');
      // We don't pre-fill from `user` object here because its existence means they should be redirected.
    }
  }, [isLoaded, authUser, user, router, isSignupFlowActive]);

  const handleNext = async () => {
    if (!name || !age || !city) {
      toast({
        variant: "destructive",
        title: "입력 필요",
        description: "이름, 나이, 도시를 모두 입력해주세요.",
      });
      return;
    }
    if (!authUser) {
        toast({
            variant: "destructive",
            title: "인증 오류",
            description: "사용자 인증 정보를 찾을 수 없습니다.",
        });
        return;
    }

    setIsSubmitting(true);

    const userData: Partial<User> & { createdAt: any } = {
      name,
      age: parseInt(age, 10),
      location: city,
      gender,
      phoneNumber: authUser.phoneNumber || '',
      id: authUser.uid,
      email: authUser.email || '',
      hobbies: ['독서', '영화 감상'],
      interests: ['맛집 탐방', '여행'],
      bio: '새로운 만남을 기다립니다!',
      lat: 37.5665,
      lng: 126.9780,
      createdAt: "serverTimestamp", // Special marker for the context
      likeCount: 0,
    };
    
    updateUser(userData).catch(error => {
      console.error("Failed to update user:", error);
      toast({
        variant: "destructive",
        title: "오류",
        description: "프로필 업데이트에 실패했습니다. 다시 시도해주세요.",
      });
      setIsSubmitting(false);
    });

    router.push('/signup/photo');
  };

  if (!isLoaded || !authUser || (user && !isSignupFlowActive)) {
    // While loading, or if no authUser (will be redirected), or if user exists (will be redirected),
    // show a loader to prevent content flash.
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white px-8 py-12">
      <header className="flex-shrink-0">
        <h1 className="text-2xl font-bold text-center">프로필 만들기</h1>
        <Progress value={25} className="w-full mt-4 h-1 bg-zinc-800" />
      </header>

      <main className="flex-grow flex flex-col justify-center mt-8">
        <div className="space-y-8">
          <div>
            <label htmlFor="name" className="text-sm font-medium text-zinc-400">
              이름
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="mt-2 bg-zinc-900 border-zinc-800 h-12 text-base"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="age" className="text-sm font-medium text-zinc-400">
              나이
            </label>
            <Input
              id="age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="나이를 입력하세요"
              className="mt-2 bg-zinc-900 border-zinc-800 h-12 text-base"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="city" className="text-sm font-medium text-zinc-400">
              도시
            </label>
            <Input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="거주 도시를 입력하세요"
              className="mt-2 bg-zinc-900 border-zinc-800 h-12 text-base"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-400">성별</label>
            <div className="mt-2 grid grid-cols-2 gap-px bg-zinc-800 rounded-lg border border-zinc-800 overflow-hidden">
              <Button
                onClick={() => setGender('여성')}
                variant={gender === '여성' ? 'default' : 'ghost'}
                disabled={isSubmitting}
                className={cn(
                  'h-12 text-base rounded-none',
                  gender === '여성'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                )}
              >
                여성
              </Button>
              <Button
                onClick={() => setGender('남성')}
                variant={gender === '남성' ? 'default' : 'ghost'}
                disabled={isSubmitting}
                className={cn(
                  'h-12 text-base rounded-none',
                  gender === '남성'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                )}
              >
                남성
              </Button>
            </div>
          </div>
        </div>
      </main>

      <footer className="flex-shrink-0 mt-8">
        <Button
          onClick={handleNext}
          disabled={isSubmitting}
          className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-full text-lg"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          다음
        </Button>
      </footer>
    </div>
  );
}
