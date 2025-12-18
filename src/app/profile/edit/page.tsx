'use client';

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Dynamically import the form component
const ProfileEditForm = React.lazy(() => import('@/components/profile-edit-form'));

export default function ProfileEditPage() {
  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <header className="sticky top-0 z-10 p-4 bg-black/80 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-center">프로필 수정</h1>
      </header>

      <Suspense
        fallback={
          <div className="flex h-[70vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }
      >
        <ProfileEditForm />
      </Suspense>
    </div>
  );
}
