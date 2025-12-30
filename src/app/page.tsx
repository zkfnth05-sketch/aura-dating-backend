'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HomePageClient from '@/components/home-page-client';
import SplashScreen from '@/components/splash-screen';
import { useUser } from '@/contexts/user-context';


export default function HomePage() {
  const router = useRouter();
  const { authUser, isLoaded, user, isSignupFlowActive } = useUser();

  useEffect(() => {
    // Wait until authentication state is fully loaded and signup flow is not active
    if (isLoaded && !isSignupFlowActive) {
      if (!authUser) {
        // 1. If no user is authenticated, redirect to the signup page.
        router.replace('/signup');
      } else if (authUser && !user) {
        // 2. If authenticated but no profile data exists (signup incomplete),
        // redirect to the profile creation page.
        router.replace('/signup/profile');
      }
      // 3. If authUser and user both exist, do nothing and let the component render HomePageClient.
    }
  }, [authUser, isLoaded, user, router, isSignupFlowActive]);

  // Show a splash screen while loading authentication state OR if a redirect is imminent.
  // This prevents the main interface from flashing before the redirect happens.
  if (!isLoaded || !authUser || !user) {
    return <SplashScreen />;
  }

  // If user has completed signup, show the main app interface.
  return <HomePageClient />;
}
