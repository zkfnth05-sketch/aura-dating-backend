'use client';

import { useState } from 'react';
import { potentialMatches, currentUser } from '@/lib/data';
import AIAnalysisDialog from '@/components/ai-analysis-dialog';
import Header from '@/components/layout/header';
import ActionButtons from '@/components/action-buttons';
import ProfileCard from '@/components/profile-card';

export default function HomePage() {
  const [users, setUsers] = useState(potentialMatches);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeState, setSwipeState] = useState<'left' | 'right' | null>(null);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

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
      <main className="flex-grow flex flex-col items-center justify-center p-4 overflow-hidden">
        <div className="relative w-full max-w-sm h-[70vh] max-h-[600px] flex items-center justify-center">
          {currentIndex >= users.length ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary">That's everyone for now!</h2>
              <p className="text-muted-foreground mt-2">Come back later for more profiles.</p>
            </div>
          ) : (
            users.map((user, index) => {
              const isActive = index === currentIndex;
              return (
                <ProfileCard
                  key={user.id}
                  user={user}
                  isActive={isActive}
                  swipeState={isActive ? swipeState : null}
                />
              );
            })
          )}
        </div>
        
        {activeUser && (
          <ActionButtons
            onDislike={() => handleAction('dislike')}
            onSuperlike={() => handleAction('superlike')}
            onLike={() => handleAction('like')}
            onAI={() => setShowAIAnalysis(true)}
          />
        )}

        {activeUser && (
          <AIAnalysisDialog
            isOpen={showAIAnalysis}
            onClose={() => setShowAIAnalysis(false)}
            user1={currentUser}
            user2={activeUser}
          />
        )}
      </main>
    </div>
  );
}
