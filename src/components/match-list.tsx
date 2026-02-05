import type { Match, User } from '@/lib/types';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/user-context';
import { useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';
import { useLanguage } from '@/contexts/language-context';


const MatchListItem = ({match}: {match: Match}) => {
    const { user: currentUser } = useUser();
    const firestore = useFirestore();

    const otherUserId = useMemo(() => {
        if (!currentUser) return null;
        return match.users.find(id => id !== currentUser.id);
    }, [match, currentUser]);

    const otherUserRef = useMemoFirebase(() => {
        if (!otherUserId || !firestore) return null;
        return doc(firestore, 'users', otherUserId);
    }, [firestore, otherUserId]);

    const { data: otherUser, isLoading: isOtherUserLoading } = useDoc<User>(otherUserRef);

    if (!currentUser) {
        return null;
    };

    if (isOtherUserLoading) {
        return (
            <div className="flex items-center gap-4 p-2">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>
        );
    }
    
    if (!otherUser) {
        // This can happen if the other user has deleted their account.
        // We render nothing in this case, effectively hiding the match from the list.
        return null;
    };
    
    const lastMessageTime = match.lastMessageTimestamp?.toDate ? match.lastMessageTimestamp.toDate().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
    }) : '...';
    
    const unreadCount = match.unreadCounts?.[currentUser.id] || 0;

    return (
        <div className="flex items-center gap-4 p-2 rounded-lg transition-colors hover:bg-accent">
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
}


export default function MatchList({ matches }: { matches: Match[] }) {
    const { t } = useLanguage();

    const sortedMatches = useMemo(() => {
        if (!matches) return [];
        return [...matches].sort((a, b) => {
            const timeA = a.lastMessageTimestamp?.seconds || 0;
            const timeB = b.lastMessageTimestamp?.seconds || 0;
            return timeB - timeA;
        });
    }, [matches]);

    if (matches.length === 0) {
        return <div className="text-center text-muted-foreground mt-8">{t('no_matches')}</div>;
    }

  return (
    <div className="space-y-2">
      {sortedMatches.map((match) => (
        <MatchListItem key={match.id} match={match} />
      ))}
    </div>
  );
}
