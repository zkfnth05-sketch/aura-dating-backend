
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import type { Match, Message, User } from '@/lib/types';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Send, Loader2, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/user-context';
import { getAIChatReplySuggestions, getChatTranslation } from '@/actions/ai-actions';
import { useToast } from '@/hooks/use-toast';
import VideoChat from '@/components/video-chat';
import { useFirestore, useCollection, useDoc, useMemoFirebase, useStorage } from '@/firebase';
import { CollectionReference, addDoc, serverTimestamp, query, orderBy, doc, updateDoc, onSnapshot, writeBatch, increment, collection, getDoc, Timestamp, limit } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useLanguage } from '@/contexts/language-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


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

const formatMessageTime = (timestamp: Timestamp | any, locale: string): string => {
    if (!timestamp?.toDate) {
      return '';
    }
    return timestamp.toDate().toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
};

const languageMap: { [key: string]: string } = {
  ko: 'Korean',
  en: 'English',
  es: 'Spanish',
  ja: 'Japanese',
};


export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;
  const firestore = useFirestore();
  const storage = useStorage();
  const { user: currentUser, isLoaded: isUserLoaded, updateUser } = useUser();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  
  const [newMessage, setNewMessage] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [lastSeenText, setLastSeenText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const matchRef = useMemoFirebase(() => {
    if (!matchId || !firestore) return null;
    return doc(firestore, 'matches', matchId);
  }, [firestore, matchId]);

  const { data: match, isLoading: isMatchLoading } = useDoc<Match>(matchRef);

  const otherUserId = useMemo(() => {
    if (!match || !currentUser?.id) return null;
    return match.users.find(id => id !== currentUser.id);
  }, [match, currentUser?.id]);

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
    return query(messagesColRef, orderBy('timestamp', 'asc'), limit(30));
  }, [messagesColRef]);
  const { data: messages, isLoading: areMessagesLoading } = useCollection<Message>(messagesQuery);
  
  const reversedMessages = useMemo(() => {
    if (!messages) return [];
    return [...messages].reverse();
  }, [messages]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if(viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [reversedMessages]);

  useEffect(() => {
    if (!firestore || !currentUser?.id || !matchRef) return;

    // Reset unread count when user enters chat
    if (match && match.unreadCounts?.[currentUser.id] > 0) {
      updateDoc(matchRef, { [`unreadCounts.${currentUser.id}`]: 0 }).catch(e => {
        if (e.code === 'permission-denied') {
          const contextualError = new FirestorePermissionError({
            operation: 'update', path: matchRef.path, requestResourceData: { unreadCount: 0 }
          });
          errorEmitter.emit('permission-error', contextualError);
        }
      });
    }

    // Listen for call status changes to show/hide the call UI
    const unsubscribe = onSnapshot(matchRef, (doc) => {
        const data = doc.data() as Match | undefined;
        if (data?.callStatus === 'active' || data?.callStatus === 'ringing') {
            setIsCallActive(true);
        } else {
            setIsCallActive(false);
        }
    });

    return () => unsubscribe();
  }, [firestore, match, currentUser?.id, matchRef]);


  useEffect(() => {
    if (otherUser) {
      const now = new Date();
      if(otherUser.lastSeen === 'Online') {
          setLastSeenText(t('online_status'));
          return;
      }
      if (!otherUser.lastSeen) {
          setLastSeenText(t('last_seen_long_ago'));
          return;
      }
      
      const lastSeenDate = new Date(otherUser.lastSeen);
      const diffInSeconds = (now.getTime() - lastSeenDate.getTime()) / 1000;
      
      if (diffInSeconds < 300) { // 5분 이내
        setLastSeenText(t('online_status'));
      } else if (diffInSeconds < 3600) { // 1시간 이내
        setLastSeenText(t('last_seen_minutes_ago').replace('%s', Math.floor(diffInSeconds / 60).toString()));
      } else if (diffInSeconds < 86400) { // 24시간 이내
        setLastSeenText(t('last_seen_hours_ago').replace('%s', Math.floor(diffInSeconds / 3600).toString()));
      } else if (diffInSeconds < 604800) { // 7일 이내
        setLastSeenText(t('last_seen_days_ago').replace('%s', Math.floor(diffInSeconds / 86400).toString()));
      } else {
        setLastSeenText(lastSeenDate.toLocaleDateString(language));
      }
    }
  }, [otherUser, t, language]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !firestore || !currentUser || !otherUser || isSending) return;
  
    const messageToSend = newMessage;
    setIsSending(true);
    setNewMessage(''); // Optimistically clear input
  
    try {
      const currentUserLang = currentUser.language || 'ko';
      const otherUserLang = otherUser.language || 'ko';
      let translations = {};
  
      if (currentUserLang !== otherUserLang) {
        try {
          const result = await getChatTranslation({
            text: messageToSend,
            targetLanguage: languageMap[otherUserLang] || 'English',
          });
          if (result.translatedText) {
            translations = { [otherUserLang]: result.translatedText };
          }
        } catch (error) {
          console.error("Chat translation failed, sending without translation:", error);
          // Proceed without translation
        }
      }
  
      const batch = writeBatch(firestore);
  
      const messageRef = doc(messagesColRef!);
      const messageData: Omit<Message, 'id'> = {
        senderId: currentUser.id,
        text: messageToSend,
        timestamp: serverTimestamp(),
        senderLanguage: currentUserLang,
        translations: translations,
      };
      batch.set(messageRef, messageData);
  
      const matchUpdateData = {
        lastMessage: messageToSend,
        lastMessageTimestamp: serverTimestamp(),
        [`unreadCounts.${otherUser.id}`]: increment(1),
      };
      batch.update(matchRef!, matchUpdateData);
  
      await batch.commit();
  
      setSuggestions([]); // Clear suggestions on successful send
    } catch (error: any) {
      console.error("Failed to send message:", error);
      setNewMessage(messageToSend); // Restore message on failure
      toast({
        variant: "destructive",
        title: "메시지 전송 실패",
        description: "메시지를 보내는 중 오류가 발생했습니다. 다시 시도해주세요."
      });
  
      if (error.code === 'permission-denied') {
        const messageDataForError = { senderId: currentUser.id, text: messageToSend };
        const matchUpdateForError = { lastMessage: messageToSend };
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          operation: 'write',
          path: `matches/${matchId}`,
          requestResourceData: { message: messageDataForError, matchUpdate: matchUpdateForError },
        }));
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleSendAudio = async (audioBlob: Blob) => {
    if (!firestore || !currentUser || !otherUser || !storage) return;

    // Update user's lastSeen when they send a message
    updateUser({ lastSeen: new Date().toISOString() });

    const audioFileRef = storageRef(storage, `audio_messages/${matchId}/${new Date().getTime()}.webm`);

    try {
        const snapshot = await uploadBytes(audioFileRef, audioBlob);
        const downloadURL = await getDownloadURL(snapshot.ref);

        const batch = writeBatch(firestore);
        const messageRef = doc(messagesColRef!);
        const messageData: Omit<Message, 'id'> = {
          senderId: currentUser.id, 
          audioUrl: downloadURL, 
          timestamp: serverTimestamp(),
          senderLanguage: currentUser.language || 'ko',
        };
        batch.set(messageRef, messageData);
    
        const matchUpdateData = {
            lastMessage: '음성 메시지', 
            lastMessageTimestamp: serverTimestamp(),
            [`unreadCounts.${otherUser.id}`]: increment(1)
        };
        batch.update(matchRef!, matchUpdateData);
    
        await batch.commit();

    } catch (error: any) {
        console.error("Error uploading audio or sending message:", error);
        if (error.code === 'storage/unauthorized' || error.code?.includes('permission-denied')) {
             toast({ variant: "destructive", title: "전송 실패", description: "음성 메시지를 보낼 권한이 없습니다." });
        } else {
             toast({ variant: "destructive", title: "음성 메시지 전송 실패", description: "오류가 발생했습니다." });
        }
    }
  };

  const handleGetSuggestions = async () => {
    if (!currentUser || !otherUser) return;
    setIsLoadingSuggestions(true);
    setSuggestions([]);
    try {
      const result = await getAIChatReplySuggestions({
          currentUser: { name: currentUser.name, bio: currentUser.bio || '', hobbies: currentUser.hobbies || [], interests: currentUser.interests || [] },
          matchUser: { name: otherUser.name, bio: otherUser.bio || '', hobbies: otherUser.hobbies || [], interests: otherUser.interests || [] },
          messages: (reversedMessages || []).map(m => ({ senderName: m.senderId === currentUser.id ? currentUser.name : otherUser.name, text: m.text || '[음성 메시지]' })),
          targetLanguage: languageMap[language] || 'Korean'
      });
      setSuggestions(result.suggestions);
    } catch (error) {
      toast({ variant: "destructive", title: t('chat_ai_suggestion_failed_title'), description: t('chat_ai_suggestion_failed_desc') });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleSendAudio(audioBlob);
        audioChunksRef.current = [];
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      toast({ variant: 'destructive', title: t('chat_mic_permission_failed_title'), description: t('chat_mic_permission_failed_desc') })
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
    if(!currentUser || !firestore || !otherUser || !matchRef) return;
    const callData = { callStatus: 'ringing' as const, callerId: currentUser.id };
    updateDoc(matchRef, callData).catch((err) => console.error("DB 업데이트 실패 에러:", err));
  };

  const handleEndCall = () => {
      // The cleanup logic is now inside the VideoChat component, 
      // but we still need to set the local state.
      setIsCallActive(false);
  }

  const isDuringConversation = useMemo(() => {
    if (!otherUser?.lastSeen) return false;
    if (otherUser.lastSeen === 'Online') return true;
    const now = new Date();
    const lastSeenDate = new Date(otherUser.lastSeen);
    const diffInMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
    return diffInMinutes <= 5;
  }, [otherUser?.lastSeen]);


  const isLoading = !isUserLoaded || isMatchLoading || (match != null && otherUserId != null && isOtherUserLoading);
  
  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!match || !currentUser || !otherUserId) {
    return (
        <div className="flex flex-col h-screen w-full items-center justify-center text-center p-4">
            <UserX className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold">{t('chat_user_not_found_title')}</h1>
            <p className="text-muted-foreground mt-2">{t('chat_user_not_found_subtitle')}</p>
            <Button onClick={() => { if (window.history.length > 1) { router.back(); } else { router.push('/matches'); } }} className="mt-8"><ArrowLeft className="mr-2 h-4 w-4" /> {t('back_button')}</Button>
        </div>
    );
  }
  
  if (!otherUser) {
    return (
        <div className="flex flex-col h-screen w-full items-center justify-center text-center p-4">
            <UserX className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold">{t('chat_user_withdrawn_title')}</h1>
            <p className="text-muted-foreground mt-2">{t('chat_user_withdrawn_subtitle')}</p>
            <Button onClick={() => { if (window.history.length > 1) { router.back(); } else { router.push('/matches'); } }} className="mt-8"><ArrowLeft className="mr-2 h-4 w-4" /> {t('back_button')}</Button>
        </div>
    );
  }

  if (isCallActive) {
    return <VideoChat localUser={currentUser} remoteUser={otherUser} matchId={matchId} onEndCall={handleEndCall} />;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center gap-4 p-4 border-b border-border/40 sticky top-0 bg-background/95 backdrop-blur z-10 flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={() => { if (window.history.length > 1) { router.back(); } else { router.push('/matches'); } }}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex items-center gap-3 flex-1">
          <Avatar>
            <AvatarImage src={otherUser.photoUrls?.[0]} alt={otherUser.name} />
            <AvatarFallback>{otherUser.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{otherUser.name}</p>
            <p className={cn("text-xs", lastSeenText === t('online_status') ? 'text-primary' : 'text-muted-foreground')}>{lastSeenText || <>&nbsp;</>}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleInitiateCall} disabled={match.callStatus === 'ringing' || match.callStatus === 'active'}>
          <VideoIcon className="h-6 w-6 text-primary" />
        </Button>
      </header>

      <ScrollArea className="flex-1 p-4 pb-20" ref={scrollAreaRef}>
        <div className="space-y-4">
          {areMessagesLoading && messages?.length === 0 && <div className="text-center text-muted-foreground">{t('chat_loading_messages')}</div>}
          {reversedMessages && reversedMessages.map((message) => {
              const isMyMessage = message.senderId === currentUser.id;
              
              const isTranslated = !isMyMessage && !!message.translations?.[language];
              
              const displayText = isTranslated 
                  ? message.translations![language]!
                  : (message.text || '');
              
              return (
                <div key={message.id} className={cn('flex items-end gap-2', isMyMessage ? 'justify-end' : 'justify-start')}>
                  {!isMyMessage && (
                    <Avatar className="h-8 w-8 self-start"><AvatarImage src={otherUser.photoUrls?.[0]} /><AvatarFallback>{otherUser.name?.charAt(0)}</AvatarFallback></Avatar>
                  )}
                  <div className={cn('flex items-end gap-2', isMyMessage ? 'flex-row-reverse' : 'flex-row')}>
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className={cn('max-w-xs md:max-w-md px-4 py-2 rounded-2xl', isMyMessage ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-accent text-accent-foreground rounded-bl-none')}>
                                {message.audioUrl ? (<audio controls src={message.audioUrl} className="h-10" />) : (<p className="text-sm break-words">{displayText}</p>)}
                                </div>
                            </TooltipTrigger>
                            {isTranslated && (
                                <TooltipContent>
                                <p><strong>Original:</strong> {message.text}</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                    <span className="text-xs text-muted-foreground pb-1">{formatMessageTime(message.timestamp, language)}</span>
                  </div>
                </div>
              );
          })}
        </div>
      </ScrollArea>

      <footer className="p-4 border-t border-border/40 flex-shrink-0">
        {(isLoadingSuggestions || suggestions.length > 0) && (
            <div className="mb-2 p-2 bg-card rounded-lg">
                {isLoadingSuggestions ? (<div className="flex items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('chat_ai_suggestion_loading')}</div>) : (
                    <div className="flex flex-wrap gap-2">{suggestions.map((suggestion, index) => (<Button key={index} variant="outline" size="sm" className="h-auto py-1.5 px-3 rounded-full" onClick={() => setNewMessage(suggestion)}>{suggestion}</Button>))}</div>
                )}
            </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" onClick={handleGetSuggestions} disabled={isLoadingSuggestions}>
            <span className="text-2xl">✨</span>
          </Button>
          <Input 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)} 
            placeholder={t('chat_input_placeholder')} 
            autoComplete="off" 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          {newMessage.trim() ? (
            <Button type="submit" size="icon" disabled={isSending}>
                {isSending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6 text-primary" />}
            </Button>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button 
                      type="button" 
                      size="icon" 
                      variant={isRecording ? 'destructive' : 'ghost'} 
                      onMouseDown={handleMicPress} 
                      onMouseUp={handleMicRelease} 
                      onTouchStart={handleMicPress} 
                      onTouchEnd={handleMicRelease}
                      disabled={!isDuringConversation}
                    >
                      <MicIcon className="h-6 w-6 text-primary" />
                    </Button>
                  </div>
                </TooltipTrigger>
                {!isDuringConversation && (
                  <TooltipContent>
                    <p>음성 메시지는 상대방과 대화 중일 때만 보낼 수 있습니다.</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
        </form>
      </footer>
    </div>
  );
}

    

    