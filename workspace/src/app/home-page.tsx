'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HomePageClient from '@/app/home-page-client';
import SplashScreen from '@/components/splash-screen';
import { useUser } from '@/contexts/user-context';


export default function HomePage() {
  const router = useRouter();
  const { authUser, isLoaded, user, isSignupFlowActive } = useUser();

  useEffect(() => {
    // Wait until authentication state is fully loaded.
    if (isLoaded) {
      if (isSignupFlowActive) {
        // If we are in the middle of signup, don't redirect anywhere.
        return;
      }
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

  // Show a splash screen while loading or redirecting.
  // This prevents the main interface from flashing before the redirect happens.
  if (!isLoaded || (isSignupFlowActive && !user) || (!isSignupFlowActive && (!authUser || !user))) {
    return <SplashScreen />;
  }
  
  // If user has completed signup, show the main app interface.
  return <HomePageClient />;
}
