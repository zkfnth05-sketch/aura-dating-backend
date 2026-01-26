
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import type { Match, Message, User } from '@/lib/types';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/user-context';
import { getAIChatReplySuggestions } from '@/actions/ai-actions';
import { useToast } from '@/hooks/use-toast';
import VideoChat from './video-chat';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
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

export default function ChatInterface({ match: initialMatch, otherUser, messagesColRef }: { match: Match; otherUser: User; messagesColRef: CollectionReference }) {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const [match, setMatch] = useState(initialMatch);
  
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [isCallActive, setIsCallActive] = useState(false);

  const [lastSeenText, setLastSeenText] = useState('');

  useEffect(() => {
    if (!currentUser?.id || !firestore) return;
  
    const matchRef = doc(firestore, 'matches', match.id);
    
    // Check and reset call status on component mount
    const resetStaleCall = async () => {
        const matchSnap = await getDoc(matchRef);
        if (matchSnap.exists()) {
            const currentMatchData = matchSnap.data() as Match;
            if (currentMatchData.callStatus === 'ringing' && currentMatchData.callerId === currentUser.id) {
                updateDoc(matchRef, { callStatus: 'idle', callerId: null }).catch(e => {
                  if (e.code === 'permission-denied') {
                    const contextualError = new FirestorePermissionError({
                      operation: 'update',
                      path: matchRef.path,
                      requestResourceData: { callStatus: 'idle', callerId: null },
                    });
                    errorEmitter.emit('permission-error', contextualError);
                  }
                });
            }
        }
    };
    resetStaleCall();

    // Reset unread count when entering the chat
    const newUnreadCounts = {
        ...match.unreadCounts,
        [currentUser.id]: 0,
    };
    if (match.unreadCounts[currentUser.id] > 0) {
        updateDoc(matchRef, { unreadCounts: newUnreadCounts }).catch(e => {
          if (e.code === 'permission-denied') {
            const contextualError = new FirestorePermissionError({
              operation: 'update',
              path: matchRef.path,
              requestResourceData: { unreadCounts: newUnreadCounts },
            });
            errorEmitter.emit('permission-error', contextualError);
          }
        });
    }

    const unsubscribe = onSnapshot(matchRef, (doc) => {
        const updatedMatch = doc.data() as Match;
        setMatch(updatedMatch);

        // If I am the caller and the call is accepted, start the call
        if(updatedMatch.callStatus === 'active' && updatedMatch.callerId === currentUser?.id) {
            setIsCallActive(true);
        }
        // If the call is ended by either party, stop the call
        if(updatedMatch.callStatus === 'idle' && isCallActive) {
            setIsCallActive(false);
        }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore, match.id, currentUser?.id]);

  const messagesQuery = useMemoFirebase(() => {
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
    // This effect runs only on the client, preventing hydration mismatch.
    const updateLastSeen = () => {
      if(otherUser) {
          const formattedText = (() => {
            if (!otherUser.lastSeen) {
                return '오래 전';
            }
            if (otherUser.lastSeen === 'Online') {
                return '온라인';
            }
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
    }
    updateLastSeen(); // Initial update
    const interval = setInterval(updateLastSeen, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [otherUser]);

  if (!currentUser || !otherUser) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !firestore) return;

    const batch = writeBatch(firestore);
    const otherUserId = otherUser.id!;

    // 1. Add new message to the messages subcollection
    const messageRef = doc(messagesColRef);
    const messageData: Omit<Message, 'id'> = {
      senderId: currentUser.id,
      text: newMessage,
      timestamp: serverTimestamp(),
    };
    batch.set(messageRef, messageData);

    // 2. Update the last message and unread count on the parent match document
    const matchRef = doc(firestore, 'matches', match.id);
    const matchUpdateData = {
      lastMessage: newMessage,
      lastMessageTimestamp: serverTimestamp(),
      lastMessageSenderId: currentUser.id,
      [`unreadCounts.${otherUserId}`]: increment(1)
    };
    batch.update(matchRef, matchUpdateData);

    batch.commit().catch(error => {
      if (error.code === 'permission-denied') {
        const contextualError = new FirestorePermissionError({
          operation: 'write', // Batch write can be complex to pinpoint
          path: `matches/${match.id} and /messages subcollection`,
          requestResourceData: { message: messageData, matchUpdate: matchUpdateData },
        });
        errorEmitter.emit('permission-error', contextualError);
      }
    });

    setNewMessage('');
    setSuggestions([]);
  };

  const handleSendAudio = (audioUrl: string) => {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    const otherUserId = otherUser.id!;

    // 1. Add new audio message
    const messageRef = doc(messagesColRef);
    const messageData: Omit<Message, 'id'> = {
      senderId: currentUser.id,
      audioUrl: audioUrl,
      timestamp: serverTimestamp(),
    };
    batch.set(messageRef, messageData);

    // 2. Update last message on match document
    const matchRef = doc(firestore, 'matches', match.id);
    const matchUpdateData = {
        lastMessage: '음성 메시지',
        lastMessageTimestamp: serverTimestamp(),
        lastMessageSenderId: currentUser.id,
        [`unreadCounts.${otherUserId}`]: increment(1)
    };
    batch.update(matchRef, matchUpdateData);

    batch.commit().catch(error => {
      if (error.code === 'permission-denied') {
        const contextualError = new FirestorePermissionError({
          operation: 'write',
          path: `matches/${match.id} and /messages subcollection`,
          requestResourceData: { message: messageData, matchUpdate: matchUpdateData },
        });
        errorEmitter.emit('permission-error', contextualError);
      }
    });
  };


  const handleGetSuggestions = async () => {
    setIsLoadingSuggestions(true);
    setSuggestions([]);
    try {
        const chatReplyInput = {
            currentUser: {
                name: currentUser.name,
                bio: currentUser.bio || '소개 없음',
                hobbies: currentUser.hobbies || [],
                interests: currentUser.interests || [],
            },
            matchUser: {
                name: otherUser.name,
                bio: otherUser.bio || '소개 없음',
                hobbies: otherUser.hobbies || [],
                interests: otherUser.interests || [],
            },
            messages: (messages || []).map(m => ({
                senderName: m.senderId === currentUser.id ? currentUser.name : otherUser.name,
                text: m.text || '[음성 메시지]',
            }))
        };
      const result = await getAIChatReplySuggestions(chatReplyInput);
      setSuggestions(result.suggestions);
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
      toast({
          variant: "destructive",
          title: "AI 추천 실패",
          description: "답장을 추천받는 데 실패했습니다. 잠시 후 다시 시도해주세요."
      })
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = function() {
            const base64Audio = reader.result as string;
            handleSendAudio(base64Audio);
        }
        audioChunksRef.current = [];
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      toast({
        variant: 'destructive',
        title: '녹음 실패',
        description: '마이크 접근 권한을 확인해주세요.',
      })
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleMicPress = () => {
    startRecording();
  };

  const handleMicRelease = () => {
    stopRecording();
  };

  const handleInitiateCall = () => {
    if(!currentUser || !firestore) return;
    const matchRef = doc(firestore, 'matches', match.id);
    const callData = {
        callStatus: 'ringing',
        callerId: currentUser.id,
    };

    updateDoc(matchRef, callData)
        .then(() => {
            toast({
                title: '통화 연결 중...',
                description: `${otherUser.name}님에게 영상 통화를 요청했습니다.`,
            });

            // Set a timeout to revert the call status if not answered
            setTimeout(async () => {
                const currentMatchSnap = await getDoc(matchRef);
                if (currentMatchSnap.exists()) {
                    const currentMatchData = currentMatchSnap.data() as Match;
                    // If the call is still ringing after 20 seconds, reset it.
                    if (currentMatchData.callStatus === 'ringing' && currentMatchData.callerId === currentUser.id) {
                        const resetData = { callStatus: 'idle', callerId: null };
                        updateDoc(matchRef, resetData).catch(e => {
                            if (e.code === 'permission-denied') {
                                const contextualError = new FirestorePermissionError({
                                    operation: 'update',
                                    path: matchRef.path,
                                    requestResourceData: resetData,
                                });
                                errorEmitter.emit('permission-error', contextualError);
                            }
                        });
                        toast({
                            variant: 'destructive',
                            title: '응답 없음',
                            description: `${otherUser.name}님이 전화를 받지 않습니다.`,
                        });
                    }
                }
            }, 20000); // 20 seconds timeout
        })
        .catch(error => {
            if (error.code === 'permission-denied') {
              const contextualError = new FirestorePermissionError({
                operation: 'update',
                path: matchRef.path,
                requestResourceData: callData,
              });
              errorEmitter.emit('permission-error', contextualError);
            } else {
                console.error("Failed to initiate call:", error);
                toast({
                    variant: "destructive",
                    title: "통화 실패",
                    description: "영상통화 요청에 실패했습니다. 다시 시도해주세요."
                });
            }
        });
  }

  const handleEndCall = () => {
      const matchRef = doc(firestore, 'matches', match.id);
      const endCallData = {
          callStatus: 'idle',
          callerId: null,
      };
      updateDoc(matchRef, endCallData).catch(e => {
          if (e.code === 'permission-denied') {
            const contextualError = new FirestorePermissionError({
              operation: 'update',
              path: matchRef.path,
              requestResourceData: endCallData,
            });
            errorEmitter.emit('permission-error', contextualError);
          }
      });
      setIsCallActive(false);
  }

  if (isCallActive) {
    return (
      <VideoChat
        localUser={currentUser}
        remoteUser={otherUser as User}
        onEndCall={handleEndCall}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center gap-4 p-4 border-b border-border/40 sticky top-0 bg-background/95 backdrop-blur z-10 flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <Avatar>
            <AvatarImage src={otherUser.photoUrls?.[0]} alt={otherUser.name} />
            <AvatarFallback>{otherUser.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{otherUser.name}</p>
            <p className={cn(
                "text-xs",
                lastSeenText === '온라인' ? 'text-primary' : 'text-muted-foreground'
            )}>
                {lastSeenText || <>&nbsp;</>}
            </p>
          </div>
        </div>
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleInitiateCall} 
            disabled={match.callStatus === 'ringing' || match.callStatus === 'active'}
        >
          <VideoIcon className="h-6 w-6 text-primary" />
        </Button>
      </header>

      <ScrollArea className="flex-1 p-4 pb-20" ref={scrollAreaRef}>
        <div className="space-y-4">
          {areMessagesLoading && <div className="text-center text-muted-foreground">메시지 로딩 중...</div>}
          {messages && messages.map((message) => (
            <div
              key={message.id}
              className={cn('flex items-end gap-2', message.senderId === currentUser.id ? 'justify-end' : 'justify-start')}
            >
              {message.senderId !== currentUser.id && (
                <Avatar className="h-8 w-8 self-start">
                  <AvatarImage src={otherUser.photoUrls?.[0]} />
                  <AvatarFallback>{otherUser.name?.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
               <div className={cn('flex items-end gap-2', message.senderId === currentUser.id ? 'flex-row-reverse' : 'flex-row')}>
                    <div
                        className={cn('max-w-xs md:max-w-md px-4 py-2 rounded-2xl',
                        message.senderId === currentUser.id
                            ? 'bg-primary text-primary-foreground rounded-br-none'
                            : 'bg-accent text-accent-foreground rounded-bl-none'
                        )}
                    >
                        {message.audioUrl ? (
                            <audio controls src={message.audioUrl} className="h-10" />
                        ) : (
                            <p className="text-sm break-words">{message.text}</p>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground pb-1">
                        {formatMessageTime(message.timestamp)}
                    </span>
                </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <footer className="p-4 border-t border-border/40 flex-shrink-0">
        {(isLoadingSuggestions || suggestions.length > 0) && (
            <div className="mb-2 p-2 bg-card rounded-lg">
                {isLoadingSuggestions ? (
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        AI가 답장을 추천하고 있어요...
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((suggestion, index) => (
                            <Button 
                                key={index}
                                variant="outline" 
                                size="sm" 
                                className="h-auto py-1.5 px-3 rounded-full"
                                onClick={() => setNewMessage(suggestion)}
                            >
                                {suggestion}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" onClick={handleGetSuggestions} disabled={isLoadingSuggestions}>
            <Sparkles className="h-6 w-6 text-primary" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            autoComplete="off"
          />
          {newMessage.trim() ? (
            <Button type="submit" size="icon">
                <Send className="h-6 w-6 text-primary" />
            </Button>
          ) : (
            <Button 
                type="button" 
                size="icon"
                variant={isRecording ? 'destructive' : 'ghost'}
                onMouseDown={handleMicPress}
                onMouseUp={handleMicRelease}
                onTouchStart={handleMicPress}
                onTouchEnd={handleMicRelease}
            >
                <MicIcon className="h-6 w-6 text-primary" />
            </Button>
          )}
        </form>
      </footer>
    </div>
  );
}
