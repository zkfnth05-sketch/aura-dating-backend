'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Map, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const HotIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        {...props}
    >
        <path d="M12 2a5.5 5.5 0 0 0-5.5 5.5c0 3.038 2.462 5.5 5.5 5.5s5.5-2.462 5.5-5.5A5.5 5.5 0 0 0 12 2z" />
        <path d="M12 13s-4-1-4-4" />
        <path d="M12 13s4-1 4-4" />
        <path d="M12 13v9" />
        <path d="M12 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
    </svg>
);

const navItems = [
  { href: '/', label: '탐색', icon: Search },
  { href: '/map', label: '지도', icon: Map },
  { href: '/hot', label: 'HOT 회원', icon: HotIcon },
  { href: '/matches', label: '연결', icon: MessageSquare },
  { href: '/profile', label: '내프로필', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide bottom nav on specific pages
  if (pathname.startsWith('/chat/') || pathname.startsWith('/profile/edit') || pathname.startsWith('/users/')) {
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
      </nav>
    </div>
  );
}
