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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const initialSettings: NotificationSettings = {
    all: true,
    newMatch: true,
    newMessage: true,
    videoCall: false,
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(initialUser);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(initialSettings);


  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const parsedData = JSON.parse(storedUser);
        setUser(prevUser => ({
          ...prevUser, 
          ...parsedData,
        }));
      }
      const storedSettings = localStorage.getItem('notificationSettings');
      if(storedSettings) {
        setNotificationSettings(JSON.parse(storedSettings));
      }

    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
      localStorage.clear();
    }
  }, []);

  const updateUser = (newUserData: Partial<User>) => {
    setUser(prevUser => {
        const updatedUser = { ...prevUser, ...newUserData };
        
        try {
          const userToStore = { ...updatedUser };
          delete userToStore.photoDataUri;
          delete userToStore.photoUrls;
          delete userToStore.photoUrl;

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
    <UserContext.Provider value={{ user, updateUser, notificationSettings, updateNotificationSettings }}>
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
