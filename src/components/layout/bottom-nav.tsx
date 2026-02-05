'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Map, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/user-context';
import { useLanguage } from '@/contexts/language-context';

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

export default function BottomNav() {
  const pathname = usePathname();
  const { totalUnreadCount } = useUser();
  const { t } = useLanguage();

  const navItems = [
    { href: '/', label: t('explore_nav'), icon: Search },
    { href: '/map', label: t('map_nav'), icon: Map },
    { href: '/hot', label: t('hot_nav'), icon: HotIcon },
    { href: '/matches', label: t('matches_nav'), icon: MessageSquare },
    { href: '/profile', label: t('profile_nav'), icon: User },
  ];

  const translucentPages = ['/', '/map', '/hot', '/matches'];
  const isTranslucent = translucentPages.includes(pathname);

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 max-w-screen-sm mx-auto",
      isTranslucent
        ? "bg-background/80 backdrop-blur-sm" 
        : "bg-background border-t border-border/40"
    )}>
      <nav className="flex justify-around items-center h-20">
        {navItems.map((item) => {
          const isActive =
            item.href === '/' ? pathname === item.href : pathname.startsWith(item.href);
          const isMatchesLink = item.href === '/matches';
          
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 text-xs w-full transition-colors duration-200 h-full',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className={cn(
                "font-medium",
                isActive && "font-bold"
              )}>{item.label}</span>

              {isMatchesLink && totalUnreadCount > 0 && (
                <div className="absolute top-2 right-1/2 translate-x-[24px] flex items-center justify-center h-4 min-w-[16px] rounded-full bg-red-500 text-white text-[10px] px-1 font-bold">
                  {totalUnreadCount}
                </div>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
