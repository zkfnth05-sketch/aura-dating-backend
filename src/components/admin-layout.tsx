'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const AdminSidebar = () => {
    const pathname = usePathname();

    const navItems = [
        { href: '/admin/dashboard', label: '대시보드' },
        { href: '/admin', label: '사용자 관리' },
    ];

    return (
        <aside className="w-64 flex-shrink-0 bg-neutral-900 text-white flex flex-col p-4">
            <div className="flex-shrink-0 mb-8">
                 <Link href="/" className="flex items-center justify-center gap-2">
                    <span className="font-headline text-3xl font-bold text-primary">
                        Aura
                    </span>
                    <span className="text-xl font-semibold">Admin</span>
                </Link>
            </div>
            <nav className="flex-grow">
                <ul>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        'flex items-center px-4 py-3 my-1 rounded-lg text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'hover:bg-neutral-800'
                                    )}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
            <div className="flex-shrink-0">
                <Button variant="destructive" className="w-full">
                    로그아웃
                </Button>
            </div>
        </aside>
    );
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-neutral-950 text-white">
            <AdminSidebar />
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
