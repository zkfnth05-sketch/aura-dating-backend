import { Button } from '@/components/ui/button';
import { SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold text-muted-foreground hover:text-primary transition-colors">탐색</Link>
        </div>
        
        <div className="absolute left-1/2 -translate-x-1/2">
            <Link href="/" className="flex items-center justify-center gap-2">
                <span className="font-headline text-2xl font-bold text-primary">
                    Aura
                </span>
            </Link>
        </div>

        <div className="flex items-center gap-2">
            <Link href="/ai" className="font-semibold text-muted-foreground hover:text-primary transition-colors text-sm">AI 추천</Link>
            <Button variant="ghost" size="icon">
                <SlidersHorizontal className="h-5 w-5" />
            </Button>
        </div>
      </div>
    </header>
  );
}
