'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Map, Flame, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '탐색', icon: Search },
  { href: '/map', label: '지도', icon: Map },
  { href: '/hot', label: 'HOT 회원', icon: Flame },
  { href: '/matches', label: '연결', icon: MessageSquare },
  { href: '/profile', label: '내프로필', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide bottom nav on chat pages
  if (pathname.startsWith('/chat/')) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border/40 z-50">
      <nav className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive =
            item.href === '/' ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs w-full',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
