
'use client';

import ProfileEditForm from '@/components/profile-edit-form';
import { useUser } from '@/contexts/user-context';
import { useLanguage } from '@/contexts/language-context';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import CoachMarkGuide from '@/components/coach-mark-guide';
import { editProfileGuide } from '@/lib/coachmark-steps';
import { Skeleton } from '@/components/ui/skeleton';

const SectionSkeleton = ({ children }: { children: React.ReactNode }) => (
    <div className="py-6 animate-pulse">
        <Skeleton className="h-5 w-1/4 mb-4" />
        <div className="space-y-2">
            {children}
        </div>
    </div>
);

const ProfileEditSkeleton = () => (
    <main className="container px-4 pb-40">
        <SectionSkeleton>
            <div className="grid grid-cols-3 gap-2">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="aspect-square rounded-lg" />
            </div>
        </SectionSkeleton>
        <SectionSkeleton>
            <Skeleton className="h-10 w-full" />
        </SectionSkeleton>
        <SectionSkeleton>
            <Skeleton className="h-10 w-full" />
        </SectionSkeleton>
        <SectionSkeleton>
            <div className="flex gap-2">
                <Skeleton className="h-10 w-20 rounded-full" />
                <Skeleton className="h-10 w-20 rounded-full" />
            </div>
        </SectionSkeleton>
        <SectionSkeleton>
            <Skeleton className="h-24 w-full" />
        </SectionSkeleton>
    </main>
);

export default function ProfileEditPage() {
  const { isLoaded } = useUser();
  const { t } = useLanguage();
  const router = useRouter();

  const header = (
    <header className="sticky top-0 z-10 p-4 bg-black/80 backdrop-blur-sm flex items-center">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-center flex-1">{t('edit_profile_title')}</h1>
        <div className="w-10"></div>
    </header>
  );

  // Show a skeleton UI while user context is loading
  if (!isLoaded) {
    return (
      <div className="bg-black text-white">
        {header}
        <ProfileEditSkeleton />
      </div>
    );
  }

  return (
    <div className="bg-black text-white">
      <CoachMarkGuide guide={editProfileGuide} />
      {header}
      <ProfileEditForm />
    </div>
  );
}
