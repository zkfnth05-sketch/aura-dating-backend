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
    // Wait until authentication state is fully loaded
    if (isLoaded) {
      if (!authUser) {
        // If no user is authenticated, redirect to the signup page.
        router.replace('/signup');
      } else if (authUser && !user) {
        // If authenticated but no profile data exists (signup incomplete),
        // redirect to the profile creation page.
        router.replace('/signup/profile');
      }
      // If authUser and user both exist, do nothing and let the main component render.
    }
  }, [authUser, isLoaded, user, router]);

  // Show a splash screen while loading authentication state OR if a redirect is imminent.
  // This prevents the main interface from flashing before the redirect happens.
  if (!isLoaded || !authUser || !user) {
    return <SplashScreen />;
  }

  // If user has completed signup, show the main app interface.
  return <HomePageClient />;
}
