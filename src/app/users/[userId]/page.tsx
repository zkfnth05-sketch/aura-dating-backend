'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useUser } from '@/contexts/user-context';
import type { User } from '@/lib/types';
import Image from 'next/image';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, Loader2, UserX } from 'lucide-react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import ImageCarouselDialog from '@/components/image-carousel-dialog';
import ActionButtons from '@/components/action-buttons';
import { getAIRecommendationReason } from '@/actions/ai-actions';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, getDocs, query, setDoc, serverTimestamp, where, addDoc } from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';


// Helper components for page structure
const ProfileSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="py-4">
    <h3 className="font-semibold text-primary text-sm mb-3">{title}</h3>
    {children}
  </div>
);

const AIReasonComponent = ({ currentUser, potentialMatch }: { currentUser: User, potentialMatch: User }) => {
  const [aiReason, setAiReason] = useState<string | null>(null);
  const [isAiReasonLoading, setIsAiReasonLoading] = useState(true);

  useEffect(() => {
    const fetchReason = async () => {
      setIsAiReasonLoading(true);
      try {
        const potentialMatchWithDefaults = {
          ...potentialMatch,
          hobbies: potentialMatch.hobbies || [],
          interests: potentialMatch.interests || [],
          values: potentialMatch.values || [],
          communication: potentialMatch.communication || [],
          lifestyle: potentialMatch.lifestyle || [],
        };
        const currentUserWithDefaults = {
          ...currentUser,
          hobbies: currentUser.hobbies || [],
          interests: currentUser.interests || [],
          values: currentUser.values || [],
          communication: currentUser.communication || [],
          lifestyle: currentUser.lifestyle || [],
        };
        
        // Remove non-serializable fields if they exist
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
  }, [currentUser, potentialMatch]);

  return (
    <div className="my-6 bg-primary/5 border border-primary/30 rounded-lg p-4 min-h-[120px] flex flex-col relative">
        <h3 className="flex items-center font-semibold text-primary text-sm">
            <Sparkles className="h-4 w-4 mr-2 text-primary/80" />
            AI 추천 이유
        </h3>
        <div className="flex-grow flex items-center justify-center pt-2">
            {isAiReasonLoading ? (
                <div className="text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary/80 mx-auto" />
                    <p className="text-sm text-foreground/70 mt-2">AI 추천 이유 생성 중...</p>
                </div>
            ) : (
                <p className="text-sm text-foreground/80 text-center">{aiReason}</p>
            )}
        </div>
    </div>
  )
}

function UserProfilePageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.userId as string;
  const source = searchParams.get('from');
  const firestore = useFirestore();
  const { toast } = useToast();

  const { user: currentUser, isLoaded, matches, peopleILiked, updateUser } = useUser();
  
  const userRef = useMemoFirebase(() => {
    if (!userId || !firestore) return null;
    return doc(firestore, 'users', userId);
  }, [firestore, userId]);

  const { data: user, isLoading: isUserLoading } = useDoc<User>(userRef);
  
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [reportReason, setReportReason] = useState("");
  const reportReasons = ["스팸 또는 광고", "음란물", "사기 또는 거짓 정보", "괴롭힘 또는 증오심 표현", "프로필 정보 불일치", "기타"];

  const isAlreadyMatched = useMemo(() => {
    if (!matches || !user) return null;
    return matches.find(m => m.users.includes(user.id)) || null;
  }, [matches, user]);

  const hasLiked = useMemo(() => {
    if (!peopleILiked || !user) return false;
    return peopleILiked.some(u => u.id === user.id);
  }, [peopleILiked, user]);


  const handleAction = async (action: 'like' | 'dislike' | 'message') => {
    if (!user || !currentUser || !firestore) return;

    const targetUserId = user.id;

    if (action === 'message') {
      if (isAlreadyMatched) {
        router.push(`/chat/${isAlreadyMatched.id}`);
        return;
      }

      // Fallback query if isAlreadyMatched is not yet available or stale
      const matchQuery = query(
        collection(firestore, 'matches'),
        where('users', 'in', [[currentUser.id, targetUserId], [targetUserId, currentUser.id]])
      );

      const matchSnapshot = await getDocs(matchQuery);
      const existingMatchDoc = matchSnapshot.docs[0];

      if (existingMatchDoc) {
        router.push(`/chat/${existingMatchDoc.id}`);
      } else {
        const newMatchRef = doc(collection(firestore, 'matches'));
        const matchData = {
          id: newMatchRef.id,
          users: [currentUser.id, targetUserId],
          matchDate: serverTimestamp(),
          lastMessage: '✨ 이제 새로운 인연과 대화를 시작할 수 있어요!',
          lastMessageTimestamp: serverTimestamp(),
          lastMessageSenderId: 'system',
          unreadCounts: { [currentUser.id]: 0, [targetUserId]: 1 },
          callStatus: 'idle' as const,
          callerId: null,
        };

        setDoc(newMatchRef, matchData)
          .then(() => {
            const messagesColRef = collection(newMatchRef, 'messages');
            addDoc(messagesColRef, {
              senderId: 'system',
              text: '✨ 이제 새로운 인연과 대화를 시작할 수 있어요!',
              timestamp: serverTimestamp(),
            }).catch(e => {
                if (e.code === 'permission-denied') {
                  const contextualError = new FirestorePermissionError({
                    operation: 'create',
                    path: `matches/${newMatchRef.id}/messages`,
                    requestResourceData: { senderId: 'system', text: '...'},
                  });
                  errorEmitter.emit('permission-error', contextualError);
                }
            });
            router.push(`/chat/${newMatchRef.id}`);
          })
          .catch(e => {
            if (e.code === 'permission-denied') {
              const contextualError = new FirestorePermissionError({
                operation: 'create',
                path: `matches/${newMatchRef.id}`,
                requestResourceData: matchData,
              });
              errorEmitter.emit('permission-error', contextualError);
            } else {
              console.error('Failed to create match:', e);
            }
          });
      }
      return;
    }

    const likeData = {
      likerId: currentUser.id,
      likeeId: targetUserId,
      isLike: action === 'like',
      timestamp: serverTimestamp(),
    };
    
    const likesCollection = collection(firestore, 'likes');

    // Non-blocking write to the new top-level 'likes' collection
    addDoc(likesCollection, likeData).catch(e => {
      if (e.code === 'permission-denied') {
        const contextualError = new FirestorePermissionError({
          operation: 'create',
          path: 'likes',
          requestResourceData: likeData,
        });
        errorEmitter.emit('permission-error', contextualError);
      } else {
        console.error("Failed to record like:", e);
      }
    });
  
    router.back();
  };

  const handleBlock = () => {
    if (!currentUser || !user) return;

    const newBlockedList = [...(currentUser.blockedUsers || []), user.id];
    updateUser({ blockedUsers: newBlockedList });

    toast({
        title: "차단 완료",
        description: `${user.name}님을 차단했습니다.`,
    });
    router.back();
  };

  const handleReport = async () => {
    if (!reportReason) {
      toast({
        variant: "destructive",
        title: "신고 사유를 선택해주세요.",
      });
      return;
    }
    if (!firestore || !currentUser || !user) return;
  
    try {
      const reportsCollection = collection(firestore, 'reports');
      await addDoc(reportsCollection, {
        reporterId: currentUser.id,
        reporterName: currentUser.name,
        reportedUserId: user.id,
        reportedUserName: user.name,
        reason: reportReason,
        timestamp: serverTimestamp(),
        status: 'new'
      });
  
      toast({
        title: "신고 접수 완료",
        description: "신고가 성공적으로 접수되었습니다. 관리자가 검토 후 조치하겠습니다.",
      });
    } catch (error) {
      console.error("Error submitting report:", error);
      toast({
        variant: "destructive",
        title: "신고 실패",
        description: "신고를 접수하는 중 오류가 발생했습니다.",
      });
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
            {source === 'ai' && currentUser && <AIReasonComponent currentUser={currentUser} potentialMatch={user} />}
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
          <div className="container px-4 my-8 flex items-center gap-2">
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                          차단하기
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>정말로 차단하시겠습니까?</AlertDialogTitle>
                          <AlertDialogDescription>
                          차단하면 이 사용자의 프로필이 더 이상 표시되지 않으며, 상대방도 회원님의 프로필을 볼 수 없게 됩니다.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction onClick={handleBlock} className={cn(buttonVariants({ variant: "destructive" }))}>
                          차단하기
                          </AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    신고하기
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{user.name}님을 신고하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription>
                      신고 사유를 선택해주세요. 허위 신고는 서비스 이용에 불이익을 받을 수 있습니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <RadioGroup value={reportReason} onValueChange={setReportReason} className="py-2 space-y-2">
                    {reportReasons.map((reason) => (
                      <div key={reason} className="flex items-center space-x-2">
                        <RadioGroupItem value={reason} id={`r-${reason}`} />
                        <Label htmlFor={`r-${reason}`} className="font-normal">{reason}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setReportReason("")}>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReport} disabled={!reportReason}>
                      신고하기
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
          </div>
        </main>
        <footer className="fixed bottom-24 left-0 right-0 z-20">
            <div className="flex justify-center">
                <ActionButtons 
                    onDislike={() => handleAction('dislike')}
                    onMessage={() => handleAction('message')}
                    onLike={() => handleAction('like')}
                    isLiked={hasLiked}
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


export default function UserProfilePage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <UserProfilePageContent />
    </Suspense>
  )
}

    