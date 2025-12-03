'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User } from '@/lib/types';
import { currentUser as initialUser } from '@/lib/data';

interface UserContextType {
  user: User;
  updateUser: (newUserData: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(initialUser);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        // Combine stored data with initial photo data
        const parsedData = JSON.parse(storedUser);
        setUser(prevUser => ({
          ...prevUser, // This keeps initial photos
          ...parsedData, // This applies stored text changes
        }));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('currentUser');
    }
  }, []);

  const updateUser = (newUserData: Partial<User>) => {
    setUser(prevUser => {
        const updatedUser = { ...prevUser, ...newUserData };
        
        try {
          // Create a copy of the user object for storing in localStorage
          const userToStore = { ...updatedUser };
          
          // Remove all large photo data URIs and URLs before saving to avoid quota errors
          delete userToStore.photoDataUri;
          delete userToStore.photoUrls;
          delete userToStore.photoUrl; // also remove single photoUrl if it's a data URI

          localStorage.setItem('currentUser', JSON.stringify(userToStore));
        } catch (error) {
          console.error("Failed to save user to localStorage", error);
        }

        return updatedUser;
    });
  };

  return (
    <UserContext.Provider value={{ user, updateUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
