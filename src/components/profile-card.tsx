import type { User } from '@/lib/types';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

type ProfileCardProps = {
  user: User;
  isActive: boolean;
  swipeState: 'left' | 'right' | null;
};

export default function ProfileCard({ user, isActive, swipeState }: ProfileCardProps) {
  const cardStyle = {
    transform: `
      translateX(${swipeState === 'left' ? '-150%' : swipeState === 'right' ? '150%' : '0'}) 
      rotate(${swipeState === 'left' ? '-20deg' : swipeState === 'right' ? '20deg' : '0'})
    `,
    transition: 'transform 0.5s ease-in-out',
    opacity: isActive ? 1 : 0,
    zIndex: isActive ? 10 : 0,
  };

  const allTags = [
    ...(user.relationship || []),
    ...(user.values || []),
    ...(user.communication || []),
    ...(user.lifestyle || []),
    ...(user.hobbies || []),
    ...(user.interests || []),
  ];

  return (
    <div
      className={cn(
        'absolute w-full h-full rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 bg-card'
      )}
      style={cardStyle}
    >
      <Image
        src={user.photoUrl}
        alt={`Profile of ${user.name}`}
        fill
        className="object-cover"
        data-ai-hint="person portrait"
        priority={isActive}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <h2 className="text-3xl font-bold drop-shadow-lg">
          {user.name}, <span className="font-light">{user.age}</span>
        </h2>
        <p className="text-white/80 mt-1 drop-shadow-md line-clamp-2">{user.bio}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {allTags.slice(0, 4).map((item) => (
            <Badge key={item} variant="secondary" className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full border-0">
              {item}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
