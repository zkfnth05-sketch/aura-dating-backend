'use client';

import React from 'react';
import type { User } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import Header from './layout/header';
import DateCourseForm from './date-course-form';
import { calculateCompatibility } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface AiPageClientProps {
  recommendedUsers: User[];
  currentUser: User;
}

const RecommendedUserCard = ({ user, currentUser }: { user: User, currentUser: User }) => {
  const router = useRouter();
  const { score, commonalities } = calculateCompatibility(currentUser, user);
  
  const prefetchUser = () => {
    router.prefetch(`/users/${user.id}?from=ai`);
  };

  return (
    <Link 
      href={`/users/${user.id}?from=ai`}
      onMouseEnter={prefetchUser}
      onTouchStart={prefetchUser}
    >
      <Card className="overflow-hidden relative group cursor-pointer border-none">
        <div className="relative aspect-[3/4]">
          <Image
            src={user.photoUrls[0]}
            alt={`Profile of ${user.name}`}
            fill
            className="object-cover"
            data-ai-hint="person portrait"
          />
        </div>

        <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2">
          <Badge className="bg-primary/90 text-primary-foreground text-xs py-1">
            {score}% 일치
          </Badge>

          {commonalities.length > 0 && (
            <Badge className="bg-primary/90 text-primary-foreground text-xs py-1">
              공통점 {commonalities.length}개
            </Badge>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.7)]">
          <p className="font-semibold truncate">{user.name}, {user.age}</p>
        </div>
      </Card>
    </Link>
  );
};


export default function AiPageClient({ recommendedUsers, currentUser }: AiPageClientProps) {

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container py-8">
        <Tabs defaultValue="ideal-type" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 border-b border-border/40 rounded-none">
            <TabsTrigger
              value="ideal-type"
              className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-muted-foreground"
            >
              AI 추천 이상형찾기
            </TabsTrigger>
            <TabsTrigger
              value="date-course"
              className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary bg-transparent text-muted-foreground"
            >
              AI 추천 데이트 코스
            </TabsTrigger>
          </TabsList>
          <TabsContent value="ideal-type" className="mt-6">
            <div className="grid grid-cols-2 gap-4">
              {recommendedUsers.map((user) => (
                <RecommendedUserCard key={user.id} user={user} currentUser={currentUser} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="date-course" className="mt-6">
            <DateCourseForm />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
