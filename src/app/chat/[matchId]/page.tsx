'use client';

import ChatInterface from '@/components/chat-interface';
import { matches, messages as allMessages } from '@/lib/data';
import type { Match, Message } from '@/lib/types';
import { notFound, useParams } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import { useState, useEffect } from 'react';

export default function ChatPage() {
  const params = useParams();
  const matchId = params.matchId as string;

  const { user: currentUser } = useUser();
  const [match, setMatch] = useState<Match | undefined>(undefined);
  
  useEffect(() => {
    const foundMatch = matches.find((m) => m.id === matchId);
    if(foundMatch) {
      setMatch(foundMatch);
    }
  }, [matchId]);
  
  const messages: Message[] | undefined = allMessages[matchId];

  if (!match) {
     // You can return a loading state or null while the match is being found
    return null;
  }

  return <ChatInterface match={match} initialMessages={messages || []} currentUserId={currentUser.id} />;
}
