'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import HomePageClient from '@/components/home-page-client';
import SplashScreen from '@/components/splash-screen';

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This check should only run on the client side.
    const isSignedUp = localStorage.getItem('isSignedUp') === 'true';

    if (!isSignedUp) {
      router.replace('/signup');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    // You can show a splash screen or a loader while checking the auth state.
    return <SplashScreen />;
  }

  return <HomePageClient />;
}
