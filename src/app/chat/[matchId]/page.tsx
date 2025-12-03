'use client';

import ChatInterface from '@/components/chat-interface';
import { matches, messages as allMessages } from '@/lib/data';
import type { Match, Message } from '@/lib/types';
import { notFound } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import { useState, useEffect } from 'react';

export default function ChatPage({ params }: { params: { matchId: string } }) {
  const { user: currentUser } = useUser();
  const [match, setMatch] = useState<Match | undefined>(undefined);
  
  useEffect(() => {
    const foundMatch = matches.find((m) => m.id === params.matchId);
    if(foundMatch) {
      setMatch(foundMatch);
    }
  }, [params.matchId]);
  
  const messages: Message[] | undefined = allMessages[params.matchId];

  if (!match) {
     // You can return a loading state or null while the match is being found
    return null;
  }

  return <ChatInterface match={match} initialMessages={messages || []} currentUserId={currentUser.id} />;
}
