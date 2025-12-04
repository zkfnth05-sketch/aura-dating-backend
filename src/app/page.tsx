'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HomePageClient from '@/components/home-page-client';
import SplashScreen from '@/components/splash-screen';
import { useUser } from '@/contexts/user-context';


export default function HomePage() {
  const router = useRouter();
  const { authUser, isLoaded, user } = useUser();

  useEffect(() => {
    if (isLoaded) {
      if (!authUser) {
        router.replace('/signup');
      } else if (!user?.photoUrl) {
        // If user is authenticated but has no profile photo,
        // it means they haven't completed the signup flow.
        router.replace('/signup/profile');
      }
    }
  }, [authUser, isLoaded, user, router]);

  if (!isLoaded || !authUser || !user?.photoUrl) {
    // Show a splash screen while loading or redirecting
    return <SplashScreen />;
  }

  return <HomePageClient />;
}
