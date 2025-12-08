'use client';

import type { User } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from './ui/card';
import { useRouter } from 'next/navigation';

export default function UserGrid({ users }: { users: User[] }) {
  const router = useRouter();
  
  if (users.length === 0) {
    return <div className="text-center text-muted-foreground mt-8">목록이 비어있습니다.</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {users.map((user) => {
        const prefetchUser = () => router.prefetch(`/users/${user.id}`);
        return (
          <Link
            href={`/users/${user.id}`}
            key={user.id}
            onMouseEnter={prefetchUser}
            onTouchStart={prefetchUser}
          >
            <Card className="overflow-hidden relative group cursor-pointer border-none aspect-[3/4]">
              <Image
                src={user.photoUrls[0]}
                alt={`Profile of ${user.name}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint="person portrait"
              />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.7)]">
                <p className="font-semibold truncate">{user.name}, {user.age}</p>
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  );
}
