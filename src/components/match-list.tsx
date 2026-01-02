import type { Match, User } from '@/lib/types';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/user-context';
import { useMemo } from 'react';

export default function MatchList({ matches }: { matches: Match[] }) {
    const { user: currentUser } = useUser();

    const sortedMatches = useMemo(() => {
        if (!matches) return [];
        return [...matches].sort((a, b) => {
            const timeA = a.lastMessageTimestamp?.seconds || 0;
            const timeB = b.lastMessageTimestamp?.seconds || 0;
            return timeB - timeA;
        });
    }, [matches]);

    if (!currentUser) return null;

    if (matches.length === 0) {
        return <div className="text-center text-muted-foreground mt-8">아직 대화 상대가 없습니다.</div>;
    }

  return (
    <div className="space-y-2">
      {sortedMatches.map((match) => {
        const otherUser = match.participants.find(p => p.id !== currentUser.id);
        if (!otherUser) return null;

        const lastMessageTime = match.lastMessageTimestamp?.toDate ? match.lastMessageTimestamp.toDate().toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
        }) : '...';
        
        const unreadCount = match.unreadCounts?.[currentUser.id] || 0;

        return (
            <div key={match.id} className="flex items-center gap-4 p-2 rounded-lg transition-colors hover:bg-accent">
            <Link href={`/users/${otherUser.id}`} onClick={(e) => e.stopPropagation()}>
                <Avatar className="h-14 w-14 border-2 border-primary/50 cursor-pointer">
                <AvatarImage src={otherUser.photoUrls?.[0]} alt={otherUser.name} />
                <AvatarFallback>{otherUser.name?.charAt(0)}</AvatarFallback>
                </Avatar>
            </Link>
            <Link href={`/chat/${match.id}`} className="flex-1 overflow-hidden">
                <div className="flex-1">
                    <div className="flex justify-between items-center">
                        <p className={cn("font-semibold", unreadCount > 0 ? "text-foreground" : "text-muted-foreground")}>{otherUser.name}</p>
                        <p className="text-xs text-muted-foreground">{lastMessageTime}</p>
                    </div>
                    <p className={cn("text-sm truncate", unreadCount > 0 ? "text-foreground" : "text-muted-foreground")}>{match.lastMessage}</p>
                </div>
            </Link>
            {unreadCount > 0 && (
                <div className="flex items-center justify-center h-5 min-w-[20px] rounded-full bg-primary text-primary-foreground text-xs font-bold px-1.5">
                    {unreadCount}
                </div>
            )}
            </div>
        )
      })}
    </div>
  );
}
