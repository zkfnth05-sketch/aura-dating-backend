import { Button } from '@/components/ui/button';
import { SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container grid h-14 max-w-screen-2xl grid-cols-3 items-center">
        <div className="flex items-center justify-start">
            <Link href="/ai" className="flex items-center gap-1 font-semibold text-muted-foreground hover:text-primary transition-colors text-sm">
                <span>✨</span>
                <span>AI 추천</span>
            </Link>
        </div>
        <div className="flex items-center justify-center">
            <Link href="/" className="flex items-center justify-center gap-2">
                <span className="font-headline text-3xl font-bold text-primary">
                    Aura
                </span>
            </Link>
        </div>
        <div className="flex items-center justify-end">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/filter">
                    <SlidersHorizontal className="h-5 w-5" />
                </Link>
            </Button>
        </div>
      </div>
    </header>
  );
}
