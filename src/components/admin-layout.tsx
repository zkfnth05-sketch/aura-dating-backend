'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useLanguage } from '@/contexts/language-context';


const AdminSidebarContent = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useLanguage();

    const navItems = [
        { href: '/admin/dashboard', label: t('admin_sidebar_dashboard') },
        { href: '/admin', label: t('admin_sidebar_user_management') },
    ];
    
    const handleLogout = () => {
        sessionStorage.removeItem('isAdminAuthenticated');
        window.location.href = '/admin'; // Redirect to force re-evaluation of auth state
    }

    return (
        <>
            <div className="flex-shrink-0 mb-8 px-4">
                 <Link href="/" className="flex items-center justify-center gap-2">
                    <span className="font-headline text-3xl font-bold text-primary">
                        Aura
                    </span>
                    <span className="text-xl font-semibold">Admin</span>
                </Link>
            </div>
            <nav className="flex-grow px-4">
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
            <div className="flex-shrink-0 px-4">
                <Button variant="destructive" className="w-full" onClick={handleLogout}>
                    {t('admin_logout_button')}
                </Button>
            </div>
        </>
    );
}

const AdminHeader = () => {
    return (
        <header className="md:hidden sticky top-0 z-10 flex items-center justify-between h-14 px-4 border-b bg-neutral-900 text-white">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 bg-neutral-900 text-white border-r-neutral-800 w-64">
                    <div className="flex h-full flex-col py-4">
                        <AdminSidebarContent/>
                    </div>
                </SheetContent>
            </Sheet>
            <Link href="/" className="flex items-center justify-center gap-2">
                <span className="font-headline text-2xl font-bold text-primary">Aura</span>
                <span className="text-lg font-semibold">Admin</span>
            </Link>
            <div className="w-8"></div>
        </header>
    )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-neutral-950 text-white">
            {/* Desktop Sidebar */}
            <aside className="w-64 flex-shrink-0 bg-neutral-900 text-white hidden md:flex flex-col py-4">
                <AdminSidebarContent />
            </aside>
            
            <div className="flex flex-col flex-1">
                <AdminHeader />
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
