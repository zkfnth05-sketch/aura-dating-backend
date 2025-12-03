import Header from '@/components/layout/header';
import MatchList from '@/components/match-list';
import { matches } from '@/lib/data';

export default function MatchesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">나의 매치</h1>
        <p className="mt-2 text-muted-foreground">
          {matches.length}명의 상대와 매치되었습니다. 대화를 시작해보세요!
        </p>
        <div className="mt-8">
          <MatchList matches={matches} />
        </div>
      </main>
    </div>
  );
}
