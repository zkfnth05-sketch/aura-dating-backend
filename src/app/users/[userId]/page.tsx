'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/user-context';
import { potentialMatches } from '@/lib/data';
import type { User } from '@/lib/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BrainCircuit, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { notFound, useRouter } from 'next/navigation';
import ImageCarouselDialog from '@/components/image-carousel-dialog';
import { getAIMatchAnalysis } from '@/app/actions/ai-actions';
import type { AIMatchEnhancementOutput } from '@/ai/flows/ai-match-enhancement';
import { Skeleton } from '@/components/ui/skeleton';

// Helper components for page structure
const ProfileSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="py-4">
    <h3 className="font-semibold text-primary text-sm mb-3">{title}</h3>
    {children}
  </div>
);

export default function UserProfilePage({ params }: { params: { userId: string } }) {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [aiAnalysis, setAiAnalysis] = useState<AIMatchEnhancementOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(true);
  const [aiError, setAiError] = useState<string | null>(null);


  useEffect(() => {
    const userId = params.userId;
    const foundUser = potentialMatches.find(u => u.id === userId);
    
    if (foundUser) {
      setUser(foundUser);
      
      setIsAiLoading(true);
      setAiError(null);
      getAIMatchAnalysis({ userProfile1: currentUser, userProfile2: foundUser })
        .then(setAiAnalysis)
        .catch(() => setAiError('AI 분석에 실패했습니다.'))
        .finally(() => setIsAiLoading(false));

    }
    setIsLoading(false);
  }, [params, currentUser]);
  
  if (isLoading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <p>Loading...</p>
        </div>
      )
  }

  if (!user) {
    notFound();
  }

  const allPhotos = user.photoUrls || [user.photoUrl];

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsCarouselOpen(true);
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-50 p-4 bg-background/80 backdrop-blur-sm">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
        </header>
        <main className="flex-1 pb-24">
          <div className="relative w-full aspect-[3/4] max-h-[70vh] cursor-pointer" onClick={() => handleImageClick(0)}>
            <Image
              src={allPhotos[0]}
              alt={`Profile of ${user.name}`}
              fill
              className="object-cover"
              data-ai-hint="person portrait"
              priority
            />
          </div>
          
          <div className="container relative z-10 px-4">
            <div className="grid grid-cols-3 gap-2 mt-4">
                {allPhotos.slice(1).map((photoUrl, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden cursor-pointer" onClick={() => handleImageClick(index + 1)}>
                        <Image 
                            src={photoUrl}
                            alt={`More photo of ${user.name} ${index + 1}`}
                            fill
                            className="object-cover"
                            data-ai-hint="person portrait"
                        />
                    </div>
                ))}
            </div>
            <div className="text-left mt-4">
                <h1 className="text-3xl font-bold">
                    {user.name}, {user.age}, {user.gender}
                </h1>
                <p className="text-muted-foreground">{user.location}</p>
            </div>
          </div>

          <div className="container relative z-10 px-4 mt-6">
            <div className="bg-card p-4 rounded-lg">
                
              <div className="bg-yellow-900/20 border border-primary/50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-primary text-sm mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    AI 추천 이유
                  </h3>
                  {isAiLoading ? (
                      <div className="space-y-2">
                          <Skeleton className="h-4 w-full bg-yellow-200/10" />
                          <Skeleton className="h-4 w-3/4 bg-yellow-200/10" />
                      </div>
                  ) : aiError ? (
                    <p className="text-sm text-destructive">{aiError}</p>
                  ) : (
                    <p className="text-sm text-foreground/90">{aiAnalysis?.analysis}</p>
                  )}
              </div>

              <ProfileSection title="소개">
                <p className="text-sm text-foreground/80">{user.bio}</p>
              </ProfileSection>

              {user.relationship && user.relationship.length > 0 && (
                <ProfileSection title="찾는 관계">
                  <div className="flex flex-wrap gap-2">
                    {user.relationship.map(item => (
                      <Badge key={item} variant="secondary" className="bg-accent text-accent-foreground font-normal">{item}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}

              {user.values && user.values.length > 0 && (
                <ProfileSection title="가치관">
                  <div className="flex flex-wrap gap-2">
                    {user.values.map(item => (
                      <Badge key={item} variant="secondary" className="bg-accent text-accent-foreground font-normal">{item}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}

              {user.communication && user.communication.length > 0 && (
                <ProfileSection title="소통 스타일">
                  <div className="flex flex-wrap gap-2">
                    {user.communication.map(item => (
                      <Badge key={item} variant="secondary" className="bg-accent text-accent-foreground font-normal">{item}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}

              {user.lifestyle && user.lifestyle.length > 0 && (
                <ProfileSection title="라이프스타일">
                  <div className="flex flex-wrap gap-2">
                    {user.lifestyle.map(item => (
                      <Badge key={item} variant="secondary" className="bg-accent text-accent-foreground font-normal">{item}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}

              <ProfileSection title="관심사">
                <div className="flex flex-wrap gap-2">
                  {user.interests.map(interest => (
                    <Badge key={interest} variant="secondary" className="bg-accent text-accent-foreground font-normal">{interest}</Badge>
                  ))}
                </div>
              </ProfileSection>

              <ProfileSection title="취미">
                <div className="flex flex-wrap gap-2">
                  {user.hobbies.map(hobby => (
                    <Badge key={hobby} variant="secondary" className="bg-accent text-accent-foreground font-normal">{hobby}</Badge>
                  ))}
                </div>
              </ProfileSection>
            </div>
          </div>
        </main>
      </div>

      <ImageCarouselDialog 
        isOpen={isCarouselOpen}
        onClose={() => setIsCarouselOpen(false)}
        images={allPhotos}
        startIndex={selectedImageIndex}
      />
    </>
  );
}
