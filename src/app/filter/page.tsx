'use server';

import { useUser } from '@/contexts/user-context';
import FilterClient from '@/components/filter-client';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/header';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// This is now a Server Component
export default async function FilterPage() {
  // In a server component, you can't use hooks directly at the top level
  // for request-specific data. If you needed to fetch server-side data based
  // on a user, you would do it here. For this case, we need the user
  // on the client to get their saved filters, so we pass it down.
  // For the purpose of this component, we don't need server-side data fetching.
  // We'll let the client component handle the user context.

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