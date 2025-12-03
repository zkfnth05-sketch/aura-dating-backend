import type { Match } from '@/lib/types';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export default function MatchList({ matches }: { matches: Match[] }) {
  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <Link href={`/chat/${match.id}`} key={match.id}>
          <div className="flex items-center gap-4 p-2 rounded-lg transition-colors hover:bg-accent">
            <Avatar className="h-14 w-14 border-2 border-primary/50">
              <AvatarImage src={match.user.photoUrl} alt={match.user.name} />
              <AvatarFallback>{match.user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-foreground">{match.user.name}</p>
                <p className="text-xs text-muted-foreground">{match.lastMessageTimestamp}</p>
              </div>
              <p className="text-sm text-muted-foreground truncate">{match.lastMessage}</p>
            </div>
            {match.lastMessage && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
          </div>
        </Link>
      ))}
    </div>
  );
}
