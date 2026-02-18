import type { Match, User } from '@/lib/types';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/user-context';
import { useMemo } from 'react';
import { Skeleton } from './ui/skeleton';
import { useLanguage } from '@/contexts/language-context';
import type { MatchWithUser } from '@/app/matches/page'; // Import the new type
import { useSelectedChat } from '@/contexts/selected-chat-context';
import { useRouter } from 'next/navigation';


const MatchListItem = ({match, otherUser}: MatchWithUser) => {
    const { user: currentUser } = useUser();
    const { t, language } = useLanguage();
    const { setSelectedChat } = useSelectedChat();
    const router = useRouter();

    if (!currentUser || !otherUser) {
        // This can happen if the other user has deleted their account.
        // We render nothing in this case, effectively hiding the match from the list.
        return null;
    };
    
    const locale = useMemo(() => {
        switch(language) {
            case 'ko': return 'ko-KR';
            case 'ja': return 'ja-JP';
            case 'es': return 'es-ES';
            default: return 'en-US';
        }
    }, [language]);

    const lastMessageTime = match.lastMessageTimestamp?.toDate ? match.lastMessageTimestamp.toDate().toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
    }) : '...';
    
    const unreadCount = match.unreadCounts?.[currentUser.id] || 0;
    
    const handleChatClick = () => {
        setSelectedChat({ match, otherUser });
    };

    const handleAvatarClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(`/users/${otherUser.id}`);
    }

    return (
        <Link href={`/chat/${match.id}`} onClick={handleChatClick} prefetch={false} className="block rounded-lg transition-colors hover:bg-accent">
            <div className="flex items-center gap-4 p-2">
                <div onClick={handleAvatarClick} className="relative cursor-pointer z-10">
                    <Avatar className="h-14 w-14 border-2 border-primary/50">
                        <AvatarImage src={otherUser.photoUrls?.[0]} alt={otherUser.name} />
                        <AvatarFallback>{otherUser.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                </div>
                <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                        <p className={cn("font-semibold", unreadCount > 0 ? "text-foreground" : "text-muted-foreground")}>{otherUser.name}</p>
                        <p className="text-xs text-muted-foreground">{lastMessageTime}</p>
                    </div>
                    <p className={cn("text-sm truncate", unreadCount > 0 ? "text-foreground" : "text-muted-foreground")}>{match.lastMessage}</p>
                </div>
                {unreadCount > 0 && (
                    <div className="flex items-center justify-center h-5 min-w-[20px] rounded-full bg-primary text-primary-foreground text-xs font-bold px-1.5">
                        {unreadCount}
                    </div>
                )}
            </div>
        </Link>
    )
}


export default function MatchList({ matchesWithUsers }: { matchesWithUsers: MatchWithUser[] }) {
    const { t } = useLanguage();

    const sortedMatches = useMemo(() => {
        if (!matchesWithUsers) return [];
        return [...matchesWithUsers].sort((a, b) => {
            const timeA = a.match.lastMessageTimestamp?.seconds || 0;
            const timeB = b.match.lastMessageTimestamp?.seconds || 0;
            return timeB - timeA;
        });
    }, [matchesWithUsers]);

    if (matchesWithUsers.length === 0) {
        return <div className="text-center text-muted-foreground mt-8">{t('no_matches')}</div>;
    }

  return (
    <div className="space-y-2">
      {sortedMatches.map(({ match, otherUser }) => (
        otherUser ? <MatchListItem key={match.id} match={match} otherUser={otherUser} /> : null
      ))}
    </div>
  );
}
