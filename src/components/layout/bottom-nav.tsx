'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Map, Flame, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/', label: '탐색', icon: Search },
  { href: '/matches', label: '연결', icon: MessageSquare },
  { href: '/ai', label: 'AI 추천', icon: Flame },
  { href: '/profile', label: '내프로필', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide bottom nav on chat pages
  if (pathname.startsWith('/chat/')) {
    return null;
  }

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-background border-t border-border/40 z-50">
      <nav className="flex justify-around items-center h-20 max-w-screen-sm mx-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === '/' ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs w-full transition-colors duration-200 h-full',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className={cn(
                "font-medium",
                isActive && "font-bold"
              )}>{item.label}</span>
            </Link>
          );
        })}
         <div className="absolute bottom-8">
            <Button asChild className="rounded-full bg-primary h-14 w-32 text-base font-bold">
                 <Link href="/profile/edit">프로필 수정</Link>
            </Button>
        </div>
      </nav>
    </div>
  );
}
