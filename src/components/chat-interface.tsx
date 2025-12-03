'use client';

import { useState, useRef, useEffect } from 'react';
import type { Match, Message } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/user-context';
import { getAIChatReplySuggestions } from '@/app/actions/ai-actions';


export default function ChatInterface({ match, initialMessages }: { match: Match; initialMessages: Message[]}) {
  const { user: currentUser } = useUser();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);


  const handleSendMessage = (e: React.FormEvent, text?: string) => {
    e.preventDefault();
    const messageText = text || newMessage;
    if (messageText.trim() === '') return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, message]);
    setNewMessage('');
    setSuggestions([]); // Clear suggestions after sending a message
  };

  const handleGetSuggestions = async () => {
    setIsLoadingSuggestions(true);
    setSuggestions([]);
    try {
        const chatReplyInput = {
            currentUser: {
                name: currentUser.name,
                bio: currentUser.bio,
                hobbies: currentUser.hobbies,
                interests: currentUser.interests,
            },
            matchUser: {
                name: match.user.name,
                bio: match.user.bio,
                hobbies: match.user.hobbies,
                interests: match.user.interests,
            },
            messages: messages.map(m => ({
                senderName: m.senderId === currentUser.id ? currentUser.name : match.user.name,
                text: m.text,
            }))
        };
      const result = await getAIChatReplySuggestions(chatReplyInput);
      setSuggestions(result.suggestions);
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
      // Optionally show a toast or error message to the user
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if(viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const otherUser = match.user;

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center gap-4 p-4 border-b border-border/40 sticky top-0 bg-background/95 backdrop-blur z-10">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/matches">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={otherUser.photoUrl} alt={otherUser.name} />
            <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{otherUser.name}</p>
            <p className="text-xs text-muted-foreground">온라인</p>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn('flex items-end gap-2', message.senderId === currentUser.id ? 'justify-end' : 'justify-start')}
            >
              {message.senderId !== currentUser.id && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={otherUser.photoUrl} />
                  <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn('max-w-xs md:max-w-md px-4 py-2 rounded-2xl',
                  message.senderId === currentUser.id
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-accent text-accent-foreground rounded-bl-none'
                )}
              >
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <footer className="p-4 border-t border-border/40">
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
            <Sparkles className="h-5 w-5 text-primary" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </footer>
    </div>
  );
}
