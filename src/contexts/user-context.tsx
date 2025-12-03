'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User } from '@/lib/types';
import { currentUser as initialUser } from '@/lib/data';

interface NotificationSettings {
  all: boolean;
  newMatch: boolean;
  newMessage: boolean;
  videoCall: boolean;
}

interface UserContextType {
  user: User;
  updateUser: (newUserData: Partial<User>) => void;
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (newSettings: Partial<NotificationSettings>) => void;
  isLoaded: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const initialSettings: NotificationSettings = {
    all: true,
    newMatch: true,
    newMessage: true,
    videoCall: true,
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(initialUser);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(initialSettings);
  const [isLoaded, setIsLoaded] = useState(false);


  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const parsedData = JSON.parse(storedUser);
        setUser(prevUser => ({
          ...prevUser, 
          ...parsedData,
          photoUrl: parsedData.photoUrl || prevUser.photoUrl,
          photoUrls: parsedData.photoUrls || prevUser.photoUrls,
        }));
      }
      const storedSettings = localStorage.getItem('notificationSettings');
      if(storedSettings) {
        setNotificationSettings(JSON.parse(storedSettings));
      }

    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
      localStorage.clear();
    } finally {
        setIsLoaded(true);
    }
  }, []);

  const updateUser = (newUserData: Partial<User>) => {
    setUser(prevUser => {
        const updatedUser = { ...prevUser, ...newUserData };
        
        try {
          // Create a copy to avoid modifying the state directly before setting it
          const userToStore = { ...updatedUser };
          
          // Don't store large data URIs in localStorage to avoid exceeding limits
          if (userToStore.photoUrls) {
            userToStore.photoUrls = userToStore.photoUrls.filter(url => !url.startsWith('data:'));
          }

          // If the main photoUrl is a data URI, try to find a non-data URI as a replacement for storage
          if (userToStore.photoUrl && userToStore.photoUrl.startsWith('data:')) {
            userToStore.photoUrl = userToStore.photoUrls?.find(url => !url.startsWith('data:')) || initialUser.photoUrl;
          }
          
          localStorage.setItem('currentUser', JSON.stringify(userToStore));
        } catch (error) {
          console.error("Failed to save user to localStorage", error);
        }

        return updatedUser;
    });
  };

  const updateNotificationSettings = (newSettings: Partial<NotificationSettings>) => {
    setNotificationSettings(prevSettings => {
        const updatedSettings = { ...prevSettings, ...newSettings };
        try {
            localStorage.setItem('notificationSettings', JSON.stringify(updatedSettings));
        } catch (error) {
            console.error("Failed to save notification settings to localStorage", error);
        }
        return updatedSettings;
    });
  };

  return (
    <UserContext.Provider value={{ user, updateUser, notificationSettings, updateNotificationSettings, isLoaded }}>
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
