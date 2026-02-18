'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Match, User } from '@/lib/types';

// This type is defined in matches/page.tsx, but we'll redefine it here to avoid circular dependencies.
export interface MatchWithUser {
  match: Match;
  otherUser?: User;
}

interface SelectedChatContextType {
  selectedChat: MatchWithUser | null;
  setSelectedChat: (chat: MatchWithUser | null) => void;
}

const SelectedChatContext = createContext<SelectedChatContextType | undefined>(undefined);

export function SelectedChatProvider({ children }: { children: ReactNode }) {
  const [selectedChat, setSelectedChat] = useState<MatchWithUser | null>(null);

  return (
    <SelectedChatContext.Provider value={{ selectedChat, setSelectedChat }}>
      {children}
    </SelectedChatContext.Provider>
  );
}

export function useSelectedChat() {
  const context = useContext(SelectedChatContext);
  if (context === undefined) {
    throw new Error('useSelectedChat must be used within a SelectedChatProvider');
  }
  return context;
}
