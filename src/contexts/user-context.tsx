'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User } from '@/lib/types';
import { currentUser as initialUser } from '@/lib/data';

interface NotificationSettings {
  all: boolean;
  newMatch: boolean;
  newMessage: boolean;
  videoCall: boolean;
  locationShared: boolean;
}

export interface FilterSettings {
    ageRange: { min: number; max: number };
    gender: ('남성' | '여성' | '기타')[];
    relationship: string[];
    values: string[];
    communication: string[];
    lifestyle: string[];
    hobbies: string[];
    interests: string[];
}

interface UserContextType {
  user: User;
  updateUser: (newUserData: Partial<User>) => void;
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (newSettings: Partial<NotificationSettings>) => void;
  filters: FilterSettings;
  updateFilters: (newFilters: Partial<FilterSettings>) => void;
  resetFilters: () => void;
  isLoaded: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const initialSettings: NotificationSettings = {
    all: true,
    newMatch: true,
    newMessage: true,
    videoCall: true,
    locationShared: true,
};

const initialFilters: FilterSettings = {
    ageRange: { min: 18, max: 99 },
    gender: [],
    relationship: [],
    values: [],
    communication: [],
    lifestyle: [],
    hobbies: [],
    interests: [],
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(initialUser);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(initialSettings);
  const [filters, setFilters] = useState<FilterSettings>(initialFilters);
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
      } else {
        // If no stored user, ensure initial user has correct photo URLs
         setUser(prevUser => {
            const photoUrls = initialUser.photoUrls || [initialUser.photoUrl];
            return { ...prevUser, ...initialUser, photoUrl: photoUrls[0], photoUrls: photoUrls };
        });
      }
      
      const storedSettings = localStorage.getItem('notificationSettings');
      if(storedSettings) {
        setNotificationSettings(JSON.parse(storedSettings));
      }

      const storedFilters = localStorage.getItem('userFilters');
      if (storedFilters) {
        setFilters(JSON.parse(storedFilters));
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
          // Exclude large image data from localStorage to prevent quota errors.
          const { photoUrl, photoUrls, ...userToStore } = updatedUser;
          
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

  const updateFilters = (newFilters: Partial<FilterSettings>) => {
    setFilters(prevFilters => {
        const updatedFilters = { ...prevFilters, ...newFilters };
        try {
            localStorage.setItem('userFilters', JSON.stringify(updatedFilters));
        } catch (error) {
            console.error("Failed to save filters to localStorage", error);
        }
        return updatedFilters;
    });
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    try {
        localStorage.setItem('userFilters', JSON.stringify(initialFilters));
    } catch (error) {
        console.error("Failed to save reset filters to localStorage", error);
    }
  };

  return (
    <UserContext.Provider value={{ user, updateUser, notificationSettings, updateNotificationSettings, filters, updateFilters, resetFilters, isLoaded }}>
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
