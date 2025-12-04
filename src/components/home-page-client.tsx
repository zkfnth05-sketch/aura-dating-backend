'use client';

import React, { useState, useEffect } from 'react';
import { potentialMatches } from '@/lib/data';
import Header from '@/components/layout/header';
import ActionButtons from '@/components/action-buttons';
import ProfileCard from '@/components/profile-card';
import { useUser } from '@/contexts/user-context';
import type { User } from '@/lib/types';
import type { FilterSettings } from '@/contexts/user-context';

const applyFilters = (users: User[], filters: FilterSettings, currentUser: User): User[] => {
    return users.filter(user => {
      // Don't show the current user in the swipe list
      if (user.id === currentUser.id) return false;

      // Age range filter
      if (user.age < filters.ageRange.min || user.age > filters.ageRange.max) {
        return false;
      }
  
      // Gender filter
      if (filters.gender.length > 0 && user.gender && !filters.gender.includes(user.gender)) {
        return false;
      }

      // Default gender preference if no filter is set
      if (filters.gender.length === 0) {
        if (currentUser.gender === '남성' && user.gender !== '여성') return false;
        if (currentUser.gender === '여성' && user.gender !== '남성') return false;
      }
  
      // Tag-based filters (relationship, values, etc.)
      const checkTags = (userTags: string[] | undefined, filterTags: string[]) => {
        if (filterTags.length === 0) return true;
        if (!userTags) return false;
        return filterTags.every(tag => userTags.includes(tag));
      };
  
      if (!checkTags(user.relationship, filters.relationship)) return false;
      if (!checkTags(user.values, filters.values)) return false;
      if (!checkTags(user.communication, filters.communication)) return false;
      if (!checkTags(user.lifestyle, filters.lifestyle)) return false;
      if (!checkTags(user.hobbies, filters.hobbies)) return false;
      if (!checkTags(user.interests, filters.interests)) return false;
  
      return true;
    });
  };

export default function HomePageClient() {
  const { user: currentUser, filters, isLoaded } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeState, setSwipeState] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    if (isLoaded) {
      const filteredUsers = applyFilters(potentialMatches, filters, currentUser);
      setUsers(filteredUsers);
      setCurrentIndex(0); 
    }
  }, [filters, isLoaded, currentUser]);

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
        <div className="relative w-full max-w-sm h-[70vh] max-h-[600px] flex items-center justify-center">
          {isLoaded && users.length === 0 ? (
             <div className="text-center">
              <h2 className="text-2xl font-bold text-primary">추천 상대가 없어요!</h2>
              <p className="text-muted-foreground mt-2">필터 조건을 수정하거나 나중에 다시 확인해주세요.</p>
            </div>
          ) : isLoaded && currentIndex >= users.length ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary">오늘은 여기까지예요!</h2>
              <p className="text-muted-foreground mt-2">새로운 상대를 보려면 나중에 다시 확인해주세요.</p>
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
