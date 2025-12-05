'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User as AuthUser } from 'firebase/auth';
import { useUser as useAuthUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { User } from '@/lib/types';

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
  user: User | null;
  authUser: AuthUser | null;
  updateUser: (newUserData: Partial<User>) => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const { user: authUser, isUserLoading } = useAuthUser();
  const firestore = useFirestore();

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(initialSettings);
  const [filters, setFilters] = useState<FilterSettings>(initialFilters);
  const [isLoaded, setIsLoaded] = useState(false);


  useEffect(() => {
    const loadInitialData = async () => {
        if (authUser) {
            const userRef = doc(firestore, 'users', authUser.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                setUser(userSnap.data() as User);
            }
        } else {
            setUser(null);
        }

        try {
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
        } finally {
            setIsLoaded(!isUserLoading);
        }
    };
    
    loadInitialData();

  }, [authUser, isUserLoading, firestore]);

  const updateUser = async (newUserData: Partial<User>) => {
    if (!authUser) return;
  
    const userRef = doc(firestore, 'users', authUser.uid);
  
    // Ensure the ID is always included when saving to Firestore
    const dataToSave: any = { ...newUserData, id: authUser.uid };
    
    if (newUserData.createdAt === 'serverTimestamp') {
        dataToSave.createdAt = serverTimestamp();
    }
  
    await setDoc(userRef, dataToSave, { merge: true });
  
    setUser(prevUser => {
      const updatedUser = { ...(prevUser || {}), ...newUserData, id: authUser.uid } as User;
      
      // Prevent storing the string 'serverTimestamp' in the local state
      if (newUserData.createdAt === 'serverTimestamp') {
        delete (updatedUser as Partial<User>).createdAt;
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

  const value = {
    user,
    authUser,
    updateUser,
    notificationSettings,
    updateNotificationSettings,
    filters,
    updateFilters,
    resetFilters,
    isLoaded,
  };

  return (
    <UserContext.Provider value={value}>
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
