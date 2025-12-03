'use client';

import React, { useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import type { AIMatchEnhancementOutput } from '@/ai/flows/ai-match-enhancement';
import { getAIMatchAnalysis } from '@/app/actions/ai-actions';
import { currentUser } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Header from './layout/header';

type AnalysisState = {
  isLoading: boolean;
  data: AIMatchEnhancementOutput | null;
  error: string | null;
};

interface AiPageClientProps {
  recommendedUsers: User[];
}

export default function AiPageClient({ recommendedUsers }: AiPageClientProps) {
  const [analysisResults, setAnalysisResults] = useState<Record<string, AnalysisState>>({});

  useEffect(() => {
    recommendedUsers.forEach(user => {
      if (!analysisResults[user.id]) {
        setAnalysisResults(prev => ({
          ...prev,
          [user.id]: { isLoading: true, data: null, error: null },
        }));

        getAIMatchAnalysis({ userProfile1: currentUser, userProfile2: user })
          .then(data => {
            setAnalysisResults(prev => ({
              ...prev,
              [user.id]: { isLoading: false, data, error: null },
            }));
          })
          .catch(() => {
            setAnalysisResults(prev => ({
              ...prev,
              [user.id]: { isLoading: false, data: null, error: '분석 실패' },
            }));
          });
      }
    });
  }, [recommendedUsers, analysisResults]);

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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recommendedUsers.map((user) => {
                const analysis = analysisResults[user.id];
                const commonalitiesCount = (analysis?.data?.sharedHobbies?.length || 0) + (analysis?.data?.sharedInterests?.length || 0);

                return (
                  <Link href={`/users/${user.id}`} key={user.id}>
                    <Card 
                      className="overflow-hidden relative group cursor-pointer"
                    >
                      <div className="relative aspect-[3/4]">
                        <Image
                          src={user.photoUrl}
                          alt={`Profile of ${user.name}`}
                          fill
                          className="object-cover"
                          data-ai-hint="person portrait"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      </div>
                      
                      <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2">
                        {analysis?.isLoading ? (
                            <Skeleton className="h-6 w-12 rounded-md bg-white/30" />
                        ) : analysis?.data ? (
                            <Badge className="bg-primary/90 text-primary-foreground text-xs py-1">
                                {analysis.data.compatibilityScore}% 일치
                            </Badge>
                        ) : null}

                        {analysis?.isLoading ? (
                           <Skeleton className="h-6 w-20 rounded-md bg-black/40" />
                        ) : commonalitiesCount > 0 ? (
                           <Badge variant="secondary" className="bg-black/50 text-white border-none text-xs py-1">
                                공통점 {commonalitiesCount}개
                           </Badge>
                        ) : null}
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <p className="font-semibold truncate">{user.name}, {user.age}</p>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </TabsContent>
          <TabsContent value="date-course">
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">준비 중입니다.</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
