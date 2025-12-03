import type { Match } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from './ui/card';

export default function MatchList({ matches }: { matches: Match[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {matches.map((match) => (
        <Link href={`/chat/${match.id}`} key={match.id}>
          <Card className="overflow-hidden transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/20">
            <div className="relative aspect-square">
                <Image
                    src={match.user.photoUrl}
                    alt={`Profile of ${match.user.name}`}
                    fill
                    className="object-cover"
                    data-ai-hint="person portrait"
                />
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="font-semibold text-white truncate">{match.user.name}</p>
                    <p className="text-xs text-white/80 truncate">{match.lastMessage}</p>
                </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
