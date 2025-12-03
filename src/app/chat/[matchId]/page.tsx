import ChatInterface from '@/components/chat-interface';
import { matches, messages as allMessages } from '@/lib/data';
import type { Match, Message } from '@/lib/types';
import { notFound } from 'next/navigation';

export default function ChatPage({ params }: { params: { matchId: string } }) {
  const match: Match | undefined = matches.find((m) => m.id === params.matchId);
  const messages: Message[] | undefined = allMessages[params.matchId];

  if (!match) {
    notFound();
  }

  return <ChatInterface match={match} initialMessages={messages || []} />;
}
