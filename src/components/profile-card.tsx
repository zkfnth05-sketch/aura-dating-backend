import type { User } from '@/lib/types';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import Link from 'next/link';
import { calculateCompatibility } from '@/lib/utils';
import React from 'react';
import { useRouter } from 'next/navigation';

type ProfileCardProps = {
  currentUser: User;
  potentialMatch: User;
  isActive: boolean;
  swipeState: 'left' | 'right' | null;
  depth: number;
};

const ProfileCard = React.memo(({ currentUser, potentialMatch, isActive, swipeState, depth }: ProfileCardProps) => {
  const router = useRouter();
  const { score, commonalities } = calculateCompatibility(currentUser, potentialMatch);
  
  const cardStyle: React.CSSProperties = {
    transform: `
      translateX(${isActive && swipeState === 'left' ? '-150%' : isActive && swipeState === 'right' ? '150%' : '0'}) 
      rotate(${isActive && swipeState === 'left' ? '-20deg' : isActive && swipeState === 'right' ? '20deg' : '0'})
      scale(${1 - (depth * 0.05)})
      translateY(${depth * 15}px)
    `,
    transformOrigin: 'bottom center',
    transition: 'transform 0.5s ease-out, opacity 0.5s',
    opacity: depth > 1 ? 0 : 1,
    zIndex: 50 - depth,
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none'
  };

  const allTags = [
    ...(potentialMatch.relationship || []),
    ...(potentialMatch.values || []),
    ...(potentialMatch.communication || []),
    ...(potentialMatch.lifestyle || []),
    ...(potentialMatch.hobbies || []),
    ...(potentialMatch.interests || []),
  ];

  return (
    <div
      className={cn(
        'absolute w-full h-full rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 bg-card border-none will-change-transform'
      )}
      style={cardStyle}
    >
      <Link 
        href={`/users/${potentialMatch.id}`} 
        className="block w-full h-full"
        draggable={false}
      >
        <div className="relative w-full h-full bg-muted">
            {potentialMatch.photoUrls && potentialMatch.photoUrls.length > 0 ? (
                <Image
                    src={potentialMatch.photoUrls[0]}
                    alt={`Profile of ${potentialMatch.name}`}
                    fill
                    className="object-cover pointer-events-none"
                    data-ai-hint="person portrait"
                    priority={isActive}
                    draggable={false}
                    sizes="(max-width: 768px) 100vw, 400px"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary">
                    <span className="text-muted-foreground">No Photo</span>
                </div>
            )}
        </div>
        
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
            <Badge className="bg-primary/90 text-primary-foreground text-xs py-1">
                {score}% 일치
            </Badge>

            {commonalities.length > 0 && (
                <Badge className="bg-primary/90 text-primary-foreground text-xs py-1">
                    공통점 {commonalities.length}개
                </Badge>
            )}
        </div>

        <div className="flex-1 p-6 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent absolute bottom-0 w-full text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold">
                {potentialMatch.name}, <span className="font-light">{potentialMatch.age}</span>
                </h2>
            </div>
            <p className="text-white/90 mt-1 line-clamp-1">{potentialMatch.bio}</p>
            <div className="flex flex-wrap gap-2 mt-4">
                {allTags.slice(0, 4).map((item) => (
                <Badge key={item} variant="secondary" className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full border-0">
                    {item}
                </Badge>
                ))}
            </div>
        </div>
      </Link>
    </div>
  );
});

ProfileCard.displayName = 'ProfileCard';

export default ProfileCard;
