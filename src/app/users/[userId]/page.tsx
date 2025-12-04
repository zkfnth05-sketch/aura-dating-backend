'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/user-context';
import type { User } from '@/lib/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { notFound, useRouter, useParams, useSearchParams } from 'next/navigation';
import ImageCarouselDialog from '@/components/image-carousel-dialog';
import ActionButtons from '@/components/action-buttons';
import { getAIRecommendationReason } from '@/app/actions/ai-actions';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';


// Helper components for page structure
const ProfileSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="py-4">
    <h3 className="font-semibold text-primary text-sm mb-3">{title}</h3>
    {children}
  </div>
);

const AIReasonSection = ({ reason, isLoading }: { reason: string | null; isLoading: boolean }) => (
    <div className="my-6 bg-primary/5 border border-primary/30 rounded-lg p-4 min-h-[120px] flex flex-col relative">
        <h3 className="flex items-center font-semibold text-primary text-sm">
            <Sparkles className="h-4 w-4 mr-2 text-primary/80" />
            AI 추천 이유
        </h3>
        <div className="flex-grow flex items-center justify-center pt-2">
            {isLoading ? (
                <div className="text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary/80 mx-auto" />
                    <p className="text-sm text-foreground/70 mt-2">AI 추천 이유 생성 중...</p>
                </div>
            ) : (
                <p className="text-sm text-foreground/80 text-center">{reason}</p>
            )}
        </div>
    </div>
)

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.userId as string;
  const source = searchParams.get('from');
  const firestore = useFirestore();

  const { user: currentUser, isLoaded } = useUser();
  
  const userRef = useMemoFirebase(() => {
    if (!userId) return null;
    return doc(firestore, 'users', userId);
  }, [firestore, userId]);
  const { data: user, isLoading } = useDoc<User>(userRef);
  
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [aiReason, setAiReason] = useState<string | null>(null);
  const [isAiReasonLoading, setIsAiReasonLoading] = useState(false);

  useEffect(() => {
    if (user && currentUser && source === 'ai' && !aiReason) {
      const fetchReason = async () => {
        setIsAiReasonLoading(true);
        try {
          const potentialMatchWithDefaults = {
            ...user,
            values: user.values || [],
            communication: user.communication || [],
            lifestyle: user.lifestyle || [],
          };
          const currentUserWithDefaults = {
            ...currentUser,
            values: currentUser.values || [],
            communication: currentUser.communication || [],
            lifestyle: currentUser.lifestyle || [],
          };

          const result = await getAIRecommendationReason({ 
              currentUser: currentUserWithDefaults, 
              potentialMatch: potentialMatchWithDefaults 
          });
          setAiReason(result.reason);
        } catch (error) {
          console.error("Failed to get AI recommendation reason:", error);
          setAiReason("추천 이유를 불러오는 데 실패했습니다.");
        } finally {
          setIsAiReasonLoading(false);
        }
      }
      fetchReason();
    }
  }, [user, currentUser, source, aiReason]);


  const handleAction = (action: 'like' | 'dislike' | 'message') => {
    if (!user) return;
    
    // This part should be handled by home-page-client's swipe logic
    // But if we want a user to be able to like from here, we need to implement it.
    // For now, we just go back.
    if (action === 'like' || action === 'dislike') {
      router.back();
      return;
    }

    if (action === 'message') {
        const matchId = `match-${user.id.split('-')[1]}`; // This logic might need to be more robust
        router.push(`/chat/${matchId}`);
        return;
    }

    console.log(action, user.name);
    router.back();
  };
  
  if (isLoading || !isLoaded) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
  }

  if (!user) {
    notFound();
  }

  const allPhotos = user.photoUrls && user.photoUrls.length > 0 ? user.photoUrls : (user.photoUrl ? [user.photoUrl] : []);

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
        <main className="flex-1 pb-40">
          <div className="relative w-full aspect-[3/4] max-h-[70vh] cursor-pointer" onClick={() => handleImageClick(0)}>
            {allPhotos[0] && (
              <Image
                src={allPhotos[0]}
                alt={`Profile of ${user.name}`}
                fill
                className="object-cover"
                data-ai-hint="person portrait"
                priority
              />
            )}
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
            {source === 'ai' && <AIReasonSection reason={aiReason} isLoading={isAiReasonLoading} />}
            <div className="bg-card p-4 rounded-lg">

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

              {user.interests && user.interests.length > 0 && (
                <ProfileSection title="관심사">
                  <div className="flex flex-wrap gap-2">
                    {user.interests.map(interest => (
                      <Badge key={interest} variant="secondary" className="bg-accent text-accent-foreground font-normal">{interest}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}
              
              {user.hobbies && user.hobbies.length > 0 && (
                <ProfileSection title="취미">
                  <div className="flex flex-wrap gap-2">
                    {user.hobbies.map(hobby => (
                      <Badge key={hobby} variant="secondary" className="bg-accent text-accent-foreground font-normal">{hobby}</Badge>
                    ))}
                  </div>
                </ProfileSection>
              )}
            </div>
          </div>
        </main>
        <footer className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex justify-center">
                <ActionButtons 
                    onDislike={() => handleAction('dislike')}
                    onMessage={() => handleAction('message')}
                    onLike={() => handleAction('like')}
                />
            </div>
        </footer>
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
