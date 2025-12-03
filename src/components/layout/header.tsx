import Link from 'next/link';
import { Flame, MessageSquare, User, Diamond } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Diamond className="h-6 w-6 text-primary" />
          <span className="font-headline text-lg font-bold text-primary">
            GoldChic
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/" aria-label="Swipe">
              <Flame className="h-5 w-5 text-foreground/80 hover:text-primary transition-colors" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/matches" aria-label="Matches">
              <MessageSquare className="h-5 w-5 text-foreground/80 hover:text-primary transition-colors" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/profile" aria-label="Profile">
              <User className="h-5 w-5 text-foreground/80 hover:text-primary transition-colors" />
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
