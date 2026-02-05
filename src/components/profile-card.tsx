import type { User } from '@/lib/types';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import Link from 'next/link';
import { calculateCompatibility } from '@/lib/utils';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';

type ProfileCardProps = {
  currentUser: User;
  potentialMatch: User;
  isActive: boolean;
  swipeState: 'left' | 'right' | null;
  zIndex: number;
  depth: number;
};

const ProfileCard = React.memo(({ currentUser, potentialMatch, isActive, swipeState, zIndex, depth }: ProfileCardProps) => {
  const router = useRouter();
  const { t } = useLanguage();
  const { score, commonalities } = calculateCompatibility(currentUser, potentialMatch);
  
  const cardStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: zIndex,
    
    // translate3d와 translateZ(0px/1px)를 써서 하드웨어 가속 레이어를 분리합니다.
    transform: `
      translateX(${isActive && swipeState === 'left' ? '-150%' : isActive && swipeState === 'right' ? '150%' : '0'}) 
      rotate(${isActive && swipeState === 'left' ? '-20deg' : isActive && swipeState === 'right' ? '20deg' : '0'})
      translateY(${depth * 10}px)
      scale(${1 - (depth * 0.05)})
      translateZ(${isActive ? '1px' : '0px'}) 
    `,
    
    // 아래 카드가 위 카드를 뚫고 터치를 가로채는 것을 방지
    pointerEvents: isActive ? 'auto' : 'none',
    
    opacity: isActive ? 1 : 0.7, // 아래 카드를 조금 더 어둡게 해서 시각적 분리
    transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.1), opacity 0.3s',
    willChange: 'transform, opacity',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
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
        'rounded-2xl overflow-hidden shadow-2xl bg-card border-none'
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
                    <span className="text-muted-foreground">{t('no_photo')}</span>
                </div>
            )}
        </div>
        
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
            <Badge className="bg-primary/90 text-primary-foreground text-xs py-1">
                {t('match_score').replace('%s', score.toString())}
            </Badge>

            {commonalities.length > 0 && (
                <Badge className="bg-primary/90 text-primary-foreground text-xs py-1">
                    {t('common_points').replace('%s', commonalities.length.toString())}
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
