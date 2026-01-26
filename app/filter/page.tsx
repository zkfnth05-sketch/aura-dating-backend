'use client';

import FilterClient from '@/components/filter-client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function FilterPage() {

  return (
    <div className="min-h-screen bg-black text-white">
        <header className="sticky top-0 z-10 p-4 bg-black/80 backdrop-blur-sm flex items-center">
            <Link href="/" className="mr-2 p-2">
                <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold text-center flex-1">필터</h1>
            <div className="w-10"></div>
        </header>
        <FilterClient />
    </div>
  );
}
