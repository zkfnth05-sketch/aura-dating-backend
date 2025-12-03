'use client';

import { useState, useEffect } from 'react';
import { potentialMatches } from '@/lib/data';
import Header from '@/components/layout/header';
import ActionButtons from '@/components/action-buttons';
import ProfileCard from '@/components/profile-card';
import { useUser } from '@/contexts/user-context';
import { getAIMatchAnalysis } from '@/app/actions/ai-actions';
import type { AIMatchEnhancementOutput } from '@/ai/flows/ai-match-enhancement';

type AnalysisState = {
  isLoading: boolean;
  data: AIMatchEnhancementOutput | null;
  error: string | null;
};

export default function HomePage() {
  const [users, setUsers] = useState(potentialMatches);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeState, setSwipeState] = useState<'left' | 'right' | null>(null);

  const { user: currentUser } = useUser();
  const [analysisResults, setAnalysisResults] = useState<Record<string, AnalysisState>>({});

  useEffect(() => {
    users.forEach(user => {
      // Don't re-fetch if data already exists or is loading
      if (!analysisResults[user.id]) {
        setAnalysisResults(prev => ({ ...prev, [user.id]: { isLoading: true, data: null, error: null } }));
        
        getAIMatchAnalysis({ userProfile1: currentUser, userProfile2: user })
          .then(data => {
            setAnalysisResults(prev => ({ ...prev, [user.id]: { isLoading: false, data, error: null } }));
          })
          .catch(() => {
            setAnalysisResults(prev => ({ ...prev, [user.id]: { isLoading: false, data: null, error: '분석 실패' } }));
          });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, users]);

  const handleAction = (action: 'like' | 'dislike' | 'superlike') => {
    if (currentIndex >= users.length) return;

    const direction = action === 'dislike' ? 'left' : 'right';
    setSwipeState(direction);

    // In a real app, this would send data to the backend.
    console.log(action, users[currentIndex].name);

    // Animate out and then move to the next card.
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSwipeState(null);
    }, 500); // This timeout should match the CSS transition duration.
  };
  
  const activeUser = users[currentIndex];

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-grow flex flex-col items-center p-4 overflow-hidden">
        <div className="relative w-full max-w-sm h-[70vh] max-h-[600px] flex items-center">
          {currentIndex >= users.length ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary">오늘은 여기까지예요!</h2>
              <p className="text-muted-foreground mt-2">새로운 상대를 보려면 나중에 다시 확인해주세요.</p>
            </div>
          ) : (
            users.map((user, index) => {
              const isActive = index === currentIndex;
              const analysis = analysisResults[user.id];
              // Prevent non-active cards from being clickable
              if (index < currentIndex) return null;
              
              return (
                <div key={user.id} className="absolute w-full h-full">
                  <ProfileCard
                    user={user}
                    isActive={isActive}
                    swipeState={isActive ? swipeState : null}
                    analysis={analysis}
                  />
                </div>
              );
            })
          )}
        </div>
        
        {activeUser && (
          <div className="absolute bottom-24 z-20">
            <ActionButtons
              onDislike={() => handleAction('dislike')}
              onSuperlike={() => handleAction('superlike')}
              onLike={() => handleAction('like')}
            />
          </div>
        )}
      </main>
    </div>
  );
}
