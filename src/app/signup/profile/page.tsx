'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export default function CreateProfilePage() {
  const router = useRouter();
  const { user, updateUser, authUser, isLoaded } = useUser();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState<'여성' | '남성' | '기타'>('여성');

  useEffect(() => {
    if (isLoaded) {
      if (!authUser) {
        router.replace('/signup');
      } else {
        setName(user?.name || authUser.displayName || '');
        setAge(user?.age?.toString() || '');
        setCity(user?.location || '');
        setGender(user?.gender || '여성');
      }
    }
  }, [isLoaded, authUser, user, router]);

  const handleNext = async () => {
    if (!name || !age || !city) {
      console.error('Please fill all fields');
      return;
    }

    await updateUser({
      name,
      age: parseInt(age, 10),
      location: city,
      gender,
      // Default values for a new user
      hobbies: ['독서', '영화 감상'],
      interests: ['맛집 탐방', '여행'],
      bio: '새로운 만남을 기다립니다!',
      lat: 37.5665, // Default to Seoul
      lng: 126.9780,
    });

    router.push('/signup/photo');
  };

  if (!isLoaded || !authUser) {
    return null; // Or a loading spinner
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
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-400">성별</label>
            <div className="mt-2 grid grid-cols-2 gap-px bg-zinc-800 rounded-lg border border-zinc-800 overflow-hidden">
              <Button
                onClick={() => setGender('여성')}
                variant={gender === '여성' ? 'default' : 'ghost'}
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
          className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-full text-lg"
        >
          다음
        </Button>
      </footer>
    </div>
  );
}
