'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/user-context';
import type { User } from '@/lib/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, Loader2, UserX } from 'lucide-react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import ImageCarouselDialog from '@/components/image-carousel-dialog';
import ActionButtons from '@/components/action-buttons';
import { getAIRecommendationReason } from '@/app/actions/ai-actions';
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, getDocs, query, setDoc, serverTimestamp, where, addDoc, writeBatch, increment } from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';


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
    if (!userId || !firestore) return null;
    return doc(firestore, 'users', userId);
  }, [firestore, userId]);

  const { data: user, isLoading: isUserLoading } = useDoc<User>(userRef);
  
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
            hobbies: user.hobbies || [],
            interests: user.interests || [],
            values: user.values || [],
            communication: user.communication || [],
            lifestyle: user.lifestyle || [],
          };
          const currentUserWithDefaults = {
            ...currentUser,
            hobbies: currentUser.hobbies || [],
            interests: currentUser.interests || [],
            values: currentUser.values || [],
            communication: currentUser.communication || [],
            lifestyle: currentUser.lifestyle || [],
          };
          
          delete (potentialMatchWithDefaults as Partial<User>).createdAt;
          delete (currentUserWithDefaults as Partial<User>).createdAt;


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


  const handleAction = async (action: 'like' | 'dislike' | 'message') => {
    if (!user || !currentUser || !firestore) return;
  
    const targetUserId = user.id;
  
    if (action === 'like' || action === 'dislike') {
      const isLike = action === 'like';
      const likeRef = doc(firestore, 'users', currentUser.id, 'likes', targetUserId);
      const likeData = {
        likerId: currentUser.id,
        likeeId: targetUserId,
        isLike,
        timestamp: serverTimestamp(),
      };
      
      setDocumentNonBlocking(likeRef, likeData);
      
      if(isLike) {
        // This part is for creating a notification for the other user.
        // It's a "fire and forget" operation from the client.
        // In a production app, this would be handled by a Cloud Function
        // triggered by the write to the 'likes' collection above.
        const likedByRef = doc(firestore, 'users', targetUserId, 'likedBy', currentUser.id);
        const likedByData = {
            likerId: currentUser.id,
            timestamp: serverTimestamp(),
        };
        setDocumentNonBlocking(likedByRef, likedByData);

        // Also increment the likeCount (best effort, again, should be a function)
        const targetUserRef = doc(firestore, 'users', targetUserId);
        setDocumentNonBlocking(targetUserRef, { likeCount: increment(1) }, { merge: true });
      }

      router.back();
      return;
    }
  
    // Message Action
    if (action === 'message') {
        const matchQuery = query(collection(firestore, 'matches'), where('users', 'array-contains', currentUser.id));
        const matchSnapshot = await getDocs(matchQuery);
        
        let existingMatch: {id: string} | null = null;
        matchSnapshot.forEach(doc => {
            const match = doc.data();
            if (match.users.includes(targetUserId)) {
                existingMatch = { id: doc.id, ...match };
            }
        });
    
        if (existingMatch) {
            router.push(`/chat/${existingMatch.id}`);
        } else {
            const newMatchRef = doc(collection(firestore, 'matches'));
            const matchData = {
                id: newMatchRef.id,
                users: [currentUser.id, targetUserId],
                participants: [
                  { id: currentUser.id, name: currentUser.name, photoUrls: currentUser.photoUrls, lastSeen: currentUser.lastSeen || null },
                  { id: user.id, name: user.name, photoUrls: user.photoUrls, lastSeen: user.lastSeen || null },
                ],
                matchDate: serverTimestamp(),
                lastMessage: '✨ 이제 새로운 인연과 대화를 시작할 수 있어요!',
                lastMessageTimestamp: serverTimestamp(),
                unreadCounts: { [currentUser.id]: 0, [targetUserId]: 1 },
                callStatus: 'idle',
                callerId: null
            };

            setDoc(newMatchRef, matchData).then(() => {
                const messagesColRef = collection(newMatchRef, 'messages');
                addDoc(messagesColRef, {
                  senderId: 'system',
                  text: '✨ 이제 새로운 인연과 대화를 시작할 수 있어요!',
                  timestamp: serverTimestamp(),
                });
                router.push(`/chat/${newMatchRef.id}`);
            }).catch(e => {
                if (e.code === 'permission-denied') {
                    const contextualError = new FirestorePermissionError({
                        operation: 'create',
                        path: `matches/${newMatchRef.id}`,
                        requestResourceData: matchData,
                    });
                    errorEmitter.emit('permission-error', contextualError);
                } else {
                    console.error("Failed to create match:", e);
                }
            });
        }
        return;
    }
  };
  
  if (isUserLoading || !isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
        <div className="flex flex-col h-screen w-full items-center justify-center text-center p-4">
            <UserX className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold">사용자를 찾을 수 없습니다.</h1>
            <p className="text-muted-foreground mt-2">삭제되었거나 존재하지 않는 프로필입니다.</p>
            <Button onClick={() => router.back()} className="mt-8">
                <ArrowLeft className="mr-2 h-4 w-4" />
                뒤로 가기
            </Button>
        </div>
    );
  }

  const allPhotos = user.photoUrls && user.photoUrls.length > 0 ? user.photoUrls : [];

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
