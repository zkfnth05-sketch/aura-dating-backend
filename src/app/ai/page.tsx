'use client';

import { useState } from 'react';
import Header from '@/components/layout/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { potentialMatches, currentUser } from '@/lib/data';
import type { User } from '@/lib/types';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AIAnalysisDialog from '@/components/ai-analysis-dialog';
import { getAIMatchAnalysis } from '@/app/actions/ai-actions';
import { AIMatchEnhancementOutput } from '@/ai/flows/ai-match-enhancement';

export default function AiPage() {
  const [recommendedUsers, setRecommendedUsers] = useState<User[]>(potentialMatches.slice(0, 6));
  const [analyses, setAnalyses] = useState<Record<string, AIMatchEnhancementOutput | null>>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const handleCardClick = async (user: User) => {
    setSelectedUser(user);
    if (!analyses[user.id]) {
      try {
        const result = await getAIMatchAnalysis({ userProfile1: currentUser, userProfile2: user });
        setAnalyses(prev => ({ ...prev, [user.id]: result }));
      } catch (error) {
        console.error("Failed to get AI analysis", error);
        // Optionally, show an error to the user
      }
    }
  };

  const closeDialog = () => {
    setSelectedUser(null);
  };

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
              {recommendedUsers.map((user) => (
                <Card 
                  key={user.id} 
                  className="overflow-hidden relative group cursor-pointer"
                  onClick={() => handleCardClick(user)}
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
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <p className="font-semibold truncate">{user.name}, {user.age}</p>
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-primary/80 text-primary-foreground text-xs">AI 추천</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="date-course">
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">준비 중입니다.</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {selectedUser && (
        <AIAnalysisDialog
          isOpen={!!selectedUser}
          onClose={closeDialog}
          user1={currentUser}
          user2={selectedUser}
          initialAnalysis={analyses[selectedUser.id] || undefined}
        />
      )}
    </div>
  );
}
