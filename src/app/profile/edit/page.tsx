'use client';

import ProfileEditForm from '@/components/profile-edit-form';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/contexts/user-context';

export default function ProfileEditPage() {
  const { isLoaded } = useUser();

  // Wait for user context to be loaded before rendering the form
  // to ensure form is pre-filled correctly.
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-black text-white">
      <header className="sticky top-0 z-10 p-4 bg-black/80 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-center">프로필 수정</h1>
      </header>
      <ProfileEditForm />
    </div>
  );
}
