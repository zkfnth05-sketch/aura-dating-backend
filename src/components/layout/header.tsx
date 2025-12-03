import { Button } from '@/components/ui/button';
import { SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex-1 text-left">
           <Link href="/ai" className="font-semibold text-muted-foreground hover:text-primary transition-colors">AI 추천</Link>
        </div>
        <div className="flex-1 text-center">
            <Link href="/" className="flex items-center justify-center gap-2">
            <span className="font-headline text-2xl font-bold text-primary">
                Aura
            </span>
            </Link>
        </div>
        <div className="flex-1 text-right">
            <Button variant="ghost" size="icon">
                <SlidersHorizontal className="h-5 w-5" />
            </Button>
        </div>
      </div>
    </header>
  );
}
