'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import type { Match, Message, User } from '@/lib/types';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Send, Sparkles, Loader2, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/user-context';
import { getAIChatReplySuggestions } from '@/actions/ai-actions';
import { useToast } from '@/hooks/use-toast';
import VideoChat from '@/components/video-chat';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { CollectionReference, addDoc, serverTimestamp, query, orderBy, doc, updateDoc, onSnapshot, writeBatch, increment, collection, getDoc, Timestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const MicIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" height="24" 
        viewBox="0 0 24 24"
        fill="currentColor"
        {...props}
    >
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V24h2v-3.06A9 9 0 0 0 21 12v-2h-2z"/>
    </svg>
);

const VideoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" height="24" 
        viewBox="0 0 24 24"
        fill="currentColor"
        {...props}
    >
        <path d="M21 6.5l-4 4V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3.5l4 4v-11z"/>
    </svg>
);

const formatMessageTime = (timestamp: Timestamp | any): string => {
    if (!timestamp?.toDate) {
      return '';
    }
    return timestamp.toDate().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
};

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;
  const firestore = useFirestore();
  const { user: currentUser, isLoaded: isUserLoaded } = useUser();
  const { toast } = useToast();
  
  const [newMessage, setNewMessage] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [lastSeenText, setLastSeenText] = useState('');
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const matchRef = useMemoFirebase(() => {
    if (!matchId || !firestore) return null;
    return doc(firestore, 'matches', matchId);
  }, [firestore, matchId]);
  const { data: match, isLoading: isMatchLoading } = useDoc<Match>(matchRef);

  const otherUserId = useMemo(() => {
    if (!match || !currentUser) return null;
    return match.users.find(id => id !== currentUser.id);
  }, [match, currentUser]);

  const otherUserRef = useMemoFirebase(() => {
    if (!otherUserId || !firestore) return null;
    return doc(firestore, 'users', otherUserId);
  }, [firestore, otherUserId]);
  const { data: otherUser, isLoading: isOtherUserLoading } = useDoc<User>(otherUserRef);
  
  const messagesColRef = useMemoFirebase(() => {
    if (!matchId || !firestore) return null;
    return collection(firestore, 'matches', matchId, 'messages') as CollectionReference;
  }, [firestore, matchId]);
  
  const messagesQuery = useMemoFirebase(() => {
    if (!messagesColRef) return null;
    return query(messagesColRef, orderBy('timestamp', 'asc'));
  }, [messagesColRef]);
  const { data: messages, isLoading: areMessagesLoading } = useCollection<Message>(messagesQuery);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if(viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  useEffect(() => {
    if (!firestore || !currentUser?.id || !match) return;
    
    const currentUnreadCount = match.unreadCounts?.[currentUser.id] || 0;
    if (currentUnreadCount > 0) {
      updateDoc(matchRef!, { [`unreadCounts.${currentUser.id}`]: 0 }).catch(e => {
        if (e.code === 'permission-denied') {
          const contextualError = new FirestorePermissionError({
            operation: 'update', path: matchRef!.path, requestResourceData: { unreadCount: 0 }
          });
          errorEmitter.emit('permission-error', contextualError);
        }
      });
    }
    
    if(match.callStatus === 'active' && match.callerId === currentUser?.id) {
        setIsCallActive(true);
    }
    if(match.callStatus === 'idle' && isCallActive) {
        setIsCallActive(false);
    }

  }, [firestore, match, currentUser?.id, isCallActive, matchRef]);

  useEffect(() => {
    if (otherUser) {
      const formattedText = (() => {
        if (!otherUser.lastSeen) return '오래 전';
        if (otherUser.lastSeen === 'Online') return '온라인';
        const now = new Date();
        const lastSeenDate = new Date(otherUser.lastSeen);
        const diffInSeconds = (now.getTime() - lastSeenDate.getTime()) / 1000;
        if (diffInSeconds < 60) return '방금 전';
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}시간 전`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}일 전`;
        return lastSeenDate.toLocaleDateString('ko-KR');
      })();
      setLastSeenText(formattedText);
    }
  }, [otherUser]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !firestore || !currentUser || !otherUser) return;

    const batch = writeBatch(firestore);

    const messageRef = doc(messagesColRef!);
    const messageData: Omit<Message, 'id'> = {
      senderId: currentUser.id, text: newMessage, timestamp: serverTimestamp(),
    };
    batch.set(messageRef, messageData);

    const matchUpdateData = {
      lastMessage: newMessage, lastMessageTimestamp: serverTimestamp(),
      [`unreadCounts.${otherUser.id}`]: increment(1)
    };
    batch.update(matchRef!, matchUpdateData);

    batch.commit().catch(error => {
      if (error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          operation: 'write', path: `matches/${matchId}`, requestResourceData: { message: messageData, matchUpdate: matchUpdateData },
        }));
      }
    });

    setNewMessage('');
    setSuggestions([]);
  };

  const handleSendAudio = (audioUrl: string) => {
    if (!firestore || !currentUser || !otherUser) return;
    const batch = writeBatch(firestore);

    const messageRef = doc(messagesColRef!);
    const messageData: Omit<Message, 'id'> = {
      senderId: currentUser.id, audioUrl: audioUrl, timestamp: serverTimestamp(),
    };
    batch.set(messageRef, messageData);

    const matchUpdateData = {
        lastMessage: '음성 메시지', lastMessageTimestamp: serverTimestamp(),
        [`unreadCounts.${otherUser.id}`]: increment(1)
    };
    batch.update(matchRef!, matchUpdateData);

    batch.commit().catch(error => {
      if (error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          operation: 'write', path: `matches/${matchId}`, requestResourceData: { message: messageData, matchUpdate: matchUpdateData },
        }));
      }
    });
  };

  const handleGetSuggestions = async () => {
    if (!currentUser || !otherUser) return;
    setIsLoadingSuggestions(true);
    setSuggestions([]);
    try {
      const result = await getAIChatReplySuggestions({
          currentUser: { name: currentUser.name, bio: currentUser.bio || '', hobbies: currentUser.hobbies || [], interests: currentUser.interests || [] },
          matchUser: { name: otherUser.name, bio: otherUser.bio || '', hobbies: otherUser.hobbies || [], interests: otherUser.interests || [] },
          messages: (messages || []).map(m => ({ senderName: m.senderId === currentUser.id ? currentUser.name : otherUser.name, text: m.text || '[음성 메시지]' }))
      });
      setSuggestions(result.suggestions);
    } catch (error) {
      toast({ variant: "destructive", title: "AI 추천 실패" });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };
  
    const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => handleSendAudio(reader.result as string);
        audioChunksRef.current = [];
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      toast({ variant: 'destructive', title: '녹음 실패', description: '마이크 접근 권한을 확인해주세요.' })
    }
  };
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  const handleMicPress = () => startRecording();
  const handleMicRelease = () => stopRecording();

  const handleInitiateCall = () => {
    if(!currentUser || !firestore || !otherUser) return;
    const callData = { callStatus: 'ringing', callerId: currentUser.id };
    updateDoc(matchRef!, callData).then(() => {
      toast({ title: '통화 연결 중...', description: `${otherUser.name}님에게 영상 통화를 요청했습니다.` });
      setTimeout(async () => {
          const currentMatchSnap = await getDoc(matchRef!);
          if (currentMatchSnap.exists()) {
              const currentMatchData = currentMatchSnap.data() as Match;
              if (currentMatchData.callStatus === 'ringing' && currentMatchData.callerId === currentUser.id) {
                  const resetData = { callStatus: 'idle', callerId: null };
                  updateDoc(matchRef!, resetData).catch(e => {
                      if (e.code === 'permission-denied') errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'update', path: matchRef!.path, requestResourceData: resetData }));
                  });
                  toast({ variant: 'destructive', title: '응답 없음', description: `${otherUser.name}님이 전화를 받지 않습니다.` });
              }
          }
      }, 20000);
    }).catch(error => {
      if (error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'update', path: matchRef!.path, requestResourceData: callData }));
      } else {
        toast({ variant: "destructive", title: "통화 실패", description: "영상통화 요청에 실패했습니다." });
      }
    });
  }

  const handleEndCall = () => {
      const endCallData = { callStatus: 'idle', callerId: null };
      updateDoc(matchRef!, endCallData).catch(e => {
          if (e.code === 'permission-denied') errorEmitter.emit('permission-error', new FirestorePermissionError({ operation: 'update', path: matchRef!.path, requestResourceData: endCallData }));
      });
      setIsCallActive(false);
  }

  const isLoading = !isUserLoaded || isMatchLoading || (match != null && otherUserId != null && isOtherUserLoading);
  
  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!match || !currentUser || !otherUserId) {
    return (
        <div className="flex flex-col h-screen w-full items-center justify-center text-center p-4">
            <UserX className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold">대화 상대를 찾을 수 없습니다.</h1>
            <p className="text-muted-foreground mt-2">삭제되었거나 존재하지 않는 대화입니다.</p>
            <Button onClick={() => router.back()} className="mt-8"><ArrowLeft className="mr-2 h-4 w-4" /> 뒤로 가기</Button>
        </div>
    );
  }
  
  if (!otherUser) {
    return (
        <div className="flex flex-col h-screen w-full items-center justify-center text-center p-4">
            <UserX className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold">탈퇴한 회원과의 대화입니다.</h1>
            <p className="text-muted-foreground mt-2">상대방이 서비스를 탈퇴하여 더 이상 대화할 수 없습니다.</p>
            <Button onClick={() => router.back()} className="mt-8"><ArrowLeft className="mr-2 h-4 w-4" /> 뒤로 가기</Button>
        </div>
    );
  }

  if (isCallActive) {
    return <VideoChat localUser={currentUser} remoteUser={otherUser} onEndCall={handleEndCall} />;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center gap-4 p-4 border-b border-border/40 sticky top-0 bg-background/95 backdrop-blur z-10 flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex items-center gap-3 flex-1">
          <Avatar>
            <AvatarImage src={otherUser.photoUrls?.[0]} alt={otherUser.name} />
            <AvatarFallback>{otherUser.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{otherUser.name}</p>
            <p className={cn("text-xs", lastSeenText === '온라인' ? 'text-primary' : 'text-muted-foreground')}>{lastSeenText || <>&nbsp;</>}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleInitiateCall} disabled={match.callStatus === 'ringing' || match.callStatus === 'active'}>
          <VideoIcon className="h-6 w-6 text-primary" />
        </Button>
      </header>

      <ScrollArea className="flex-1 p-4 pb-20" ref={scrollAreaRef}>
        <div className="space-y-4">
          {areMessagesLoading && <div className="text-center text-muted-foreground">메시지 로딩 중...</div>}
          {messages && messages.map((message) => (
            <div key={message.id} className={cn('flex items-end gap-2', message.senderId === currentUser.id ? 'justify-end' : 'justify-start')}>
              {message.senderId !== currentUser.id && (
                <Avatar className="h-8 w-8 self-start"><AvatarImage src={otherUser.photoUrls?.[0]} /><AvatarFallback>{otherUser.name?.charAt(0)}</AvatarFallback></Avatar>
              )}
              <div className={cn('flex items-end gap-2', message.senderId === currentUser.id ? 'flex-row-reverse' : 'flex-row')}>
                <div className={cn('max-w-xs md:max-w-md px-4 py-2 rounded-2xl', message.senderId === currentUser.id ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-accent text-accent-foreground rounded-bl-none')}>
                  {message.audioUrl ? (<audio controls src={message.audioUrl} className="h-10" />) : (<p className="text-sm break-words">{message.text}</p>)}
                </div>
                <span className="text-xs text-muted-foreground pb-1">{formatMessageTime(message.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <footer className="p-4 border-t border-border/40 flex-shrink-0">
        {(isLoadingSuggestions || suggestions.length > 0) && (
            <div className="mb-2 p-2 bg-card rounded-lg">
                {isLoadingSuggestions ? (<div className="flex items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />AI가 답장을 추천하고 있어요...</div>) : (
                    <div className="flex flex-wrap gap-2">{suggestions.map((suggestion, index) => (<Button key={index} variant="outline" size="sm" className="h-auto py-1.5 px-3 rounded-full" onClick={() => setNewMessage(suggestion)}>{suggestion}</Button>))}</div>
                )}
            </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" onClick={handleGetSuggestions} disabled={isLoadingSuggestions}><Sparkles className="h-6 w-6 text-primary" /></Button>
          <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="메시지를 입력하세요..." autoComplete="off" />
          {newMessage.trim() ? (<Button type="submit" size="icon"><Send className="h-6 w-6 text-primary" /></Button>) : (
            <Button type="button" size="icon" variant={isRecording ? 'destructive' : 'ghost'} onMouseDown={handleMicPress} onMouseUp={handleMicRelease} onTouchStart={handleMicPress} onTouchEnd={handleMicRelease}><MicIcon className="h-6 w-6 text-primary" /></Button>
          )}
        </form>
      </footer>
    </div>
  );
}
