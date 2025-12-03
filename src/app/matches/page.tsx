import Header from '@/components/layout/header';
import MatchList from '@/components/match-list';
import { matches } from '@/lib/data';

export default function MatchesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Your Matches</h1>
        <p className="mt-2 text-muted-foreground">
          You have {matches.length} matches. Start a conversation!
        </p>
        <div className="mt-8">
          <MatchList matches={matches} />
        </div>
      </main>
    </div>
  );
}
