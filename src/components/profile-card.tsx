
import type { User } from '@/lib/types';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import Link from 'next/link';
import { calculateCompatibility } from '@/lib/utils';
import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';
import { TranslationKeys } from '@/lib/locales';

type ProfileCardProps = {
  currentUser: User;
  potentialMatch: User;
  isActive: boolean;
  swipeState: 'left' | 'right' | null;
  zIndex: number;
  depth: number;
  onSwipe: (direction: 'left' | 'right') => void;
};

const ProfileCard = React.memo(({ currentUser, potentialMatch, isActive, swipeState, zIndex, depth, onSwipe }: ProfileCardProps) => {
  const router = useRouter();
  const { t } = useLanguage();
  const { score, commonalities } = calculateCompatibility(currentUser, potentialMatch);

  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);

  const SWIPE_THRESHOLD = 100;

  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    if (!isActive) return;
    setIsDragging(true);
    hasDraggedRef.current = false;
    startPosRef.current = { x: clientX, y: clientY };
  }, [isActive]);
  
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !isActive) return;
    
    const dx = clientX - startPosRef.current.x;
    const dy = clientY - startPosRef.current.y;
    
    // Only set hasDragged if the drag is significant
    if (!hasDraggedRef.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      hasDraggedRef.current = true;
    }

    setDragPosition({ x: dx, y: dy });
  }, [isDragging, isActive]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging || !isActive) return;
    
    setIsDragging(false);

    if (Math.abs(dragPosition.x) > SWIPE_THRESHOLD) {
      if (dragPosition.x > 0) {
        onSwipe('right');
      } else {
        onSwipe('left');
      }
    } else {
      // Snap back if not swiped far enough
      setDragPosition({ x: 0, y: 0 });
    }
  }, [isDragging, isActive, dragPosition, onSwipe]);

  const handleClick = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Mouse event handlers
  const onMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX, e.clientY);
  const onMouseUp = () => handleDragEnd();
  const onMouseLeave = () => handleDragEnd();

  // Touch event handlers
  const onTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchEnd = () => handleDragEnd();

  const rotation = dragPosition.x / 20;

  let finalTransform = `translateY(${depth * 10}px) scale(${1 - (depth * 0.05)})`;
  if (isActive) {
      if (swipeState) { // An action has been triggered, card is flying out
          finalTransform = `translateX(${swipeState === 'left' ? '-150%' : '150%'}) rotate(${swipeState === 'left' ? -20 : 20}deg) ${finalTransform}`;
      } else { // Top card, interactive and draggable
          finalTransform = `translateX(${dragPosition.x}px) translateY(${dragPosition.y}px) rotate(${rotation}deg) ${finalTransform}`;
      }
  }

  const cardStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: zIndex,
    transform: finalTransform,
    pointerEvents: isActive ? 'auto' : 'none',
    opacity: isActive ? 1 : 0.7,
    transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s',
    willChange: 'transform, opacity',
    backfaceVisibility: 'hidden',
    cursor: isDragging ? 'grabbing' : (isActive ? 'grab' : 'default'),
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
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <Link 
        href={`/users/${potentialMatch.id}`} 
        className="block w-full h-full"
        draggable={false}
        onClick={handleClick}
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
                    {t(item as TranslationKeys)}
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
