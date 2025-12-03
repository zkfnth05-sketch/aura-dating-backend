import { potentialMatches, currentUser } from '@/lib/data';
import Header from '@/components/layout/header';
import { getAIMatchAnalysis } from '@/app/actions/ai-actions';
import type { AIMatchEnhancementOutput } from '@/ai/flows/ai-match-enhancement';
import HomePageClient from '@/components/home-page-client';

type AnalysisResult = {
  isLoading: boolean;
  data: AIMatchEnhancementOutput | null;
  error: string | null;
};

// This is the Server Component that fetches data
export default async function HomePage() {
  const users = potentialMatches;
  
  const analysisPromises = users.map(user => 
    getAIMatchAnalysis({ userProfile1: currentUser, userProfile2: user })
      .then(data => ({ id: user.id, data, error: null }))
      .catch(() => ({ id: user.id, data: null, error: '분석 실패' }))
  );

  const results = await Promise.all(analysisPromises);
  
  const analysisResults: Record<string, AnalysisResult> = {};
  results.forEach(result => {
    analysisResults[result.id] = {
      isLoading: false,
      data: result.data,
      error: result.error,
    };
  });

  return (
    <HomePageClient initialAnalysisResults={analysisResults} />
  );
}
