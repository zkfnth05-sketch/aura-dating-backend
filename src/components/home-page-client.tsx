'use client';

import React, { useState, useEffect } from 'react';
import { potentialMatches } from '@/lib/data';
import Header from '@/components/layout/header';
import ActionButtons from '@/components/action-buttons';
import ProfileCard from '@/components/profile-card';
import { useUser } from '@/contexts/user-context';
import type { User } from '@/lib/types';

export default function HomePageClient() {
  const { user: currentUser } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeState, setSwipeState] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    const filteredUsers = potentialMatches.filter(user => {
      if (currentUser.gender === '남성') return user.gender === '여성';
      if (currentUser.gender === '여성') return user.gender === '남성';
      return false; // For '기타' or other cases, show no one by default
    });
    setUsers(filteredUsers);
    setCurrentIndex(0); // Reset index when users change
  }, [currentUser.gender]);

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
          {users.length > 0 && currentIndex >= users.length ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary">오늘은 여기까지예요!</h2>
              <p className="text-muted-foreground mt-2">새로운 상대를 보려면 나중에 다시 확인해주세요.</p>
            </div>
          ) : users.length === 0 && !activeUser ? (
             <div className="text-center">
              <h2 className="text-2xl font-bold text-primary">추천 상대가 없어요!</h2>
              <p className="text-muted-foreground mt-2">표시할 추천 상대가 없습니다. 나중에 다시 확인해주세요.</p>
            </div>
          ) : (
            users.map((user, index) => {
              const isActive = index === currentIndex;
              // Prevent non-active cards from being clickable
              if (index < currentIndex) return null;
              
              return (
                <div key={user.id} className="absolute w-full h-full">
                  <ProfileCard
                    currentUser={currentUser}
                    potentialMatch={user}
                    isActive={isActive}
                    swipeState={isActive ? swipeState : null}
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
