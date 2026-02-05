'use client';

import ProfileEditForm from '@/components/profile-edit-form';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/contexts/user-context';
import { useLanguage } from '@/contexts/language-context';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function ProfileEditPage() {
  const { isLoaded } = useUser();
  const { t } = useLanguage();
  const router = useRouter();

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
      <header className="sticky top-0 z-10 p-4 bg-black/80 backdrop-blur-sm flex items-center">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-center flex-1">{t('edit_profile_title')}</h1>
        <div className="w-10"></div>
      </header>
      <ProfileEditForm />
    </div>
  );
}
