'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { User as AuthUser } from 'firebase/auth';
import { useUser as useAuthUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc, getDoc, serverTimestamp, collection, query, where } from 'firebase/firestore';
import type { User, Match } from '@/lib/types';

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
  updateUser: (newUserData: Partial<User>) => void;
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (newSettings: Partial<NotificationSettings>) => void;
  filters: FilterSettings;
  updateFilters: (newFilters: Partial<FilterSettings>) => void;
  resetFilters: () => void;
  isLoaded: boolean;
  totalUnreadCount: number;
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
  const [isContextLoaded, setIsContextLoaded] = useState(false);

  // Load user data from Firestore
  useEffect(() => {
    const loadUser = async () => {
      if (authUser && firestore) {
        const userRef = doc(firestore, 'users', authUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUser(userSnap.data() as User);
        } else {
          setUser(null); // User exists in Auth but not in Firestore (mid-signup)
        }
      } else {
        setUser(null); // No authenticated user
      }
    };

    loadUser();
  }, [authUser, firestore]);

  // Load settings from localStorage once on mount
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('notificationSettings');
      if (storedSettings) {
        setNotificationSettings(JSON.parse(storedSettings));
      }
      const storedFilters = localStorage.getItem('userFilters');
      if (storedFilters) {
        setFilters(JSON.parse(storedFilters));
      }
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
    }
  }, []);

  // Determine overall loading state
  useEffect(() => {
      if (!isUserLoading) {
          setIsContextLoaded(true);
      }
  }, [isUserLoading]);

  // --- Unread count logic ---
  const matchesQuery = useMemoFirebase(() => {
    if (!firestore || !user || !user.id) return null;
    return query(collection(firestore, 'matches'), where('users', 'array-contains', user.id));
  }, [firestore, user]);

  const { data: matches } = useCollection<Match>(matchesQuery);

  const totalUnreadCount = (matches || []).reduce((acc, match) => {
    if (user && user.id && match.unreadCounts) {
      return acc + (match.unreadCounts[user.id] || 0);
    }
    return acc;
  }, 0);
  // --- End unread count logic ---

  const updateUser = (newUserData: Partial<User>) => {
    if (!authUser || !firestore) return;
  
    const userRef = doc(firestore, 'users', authUser.uid);
  
    const dataToSave: any = { ...newUserData, id: authUser.uid };
    
    // This is specifically for the initial user creation during signup.
    if ((newUserData as any).createdAt === 'serverTimestamp') {
        dataToSave.createdAt = serverTimestamp();
    }
  
    // Use the non-blocking update function
    setDocumentNonBlocking(userRef, dataToSave, { merge: true });
  
    // Optimistically update the local state
    setUser(prevUser => {
      const updatedUser = { ...(prevUser || {}), ...dataToSave } as User;
      // 'createdAt' is a server value, so we don't want to keep the local 'serverTimestamp' string
      if ((newUserData as any).createdAt === 'serverTimestamp') {
        // We can't know the real timestamp yet, so we remove it or set it to null
        // For now, removing it is fine as it's not critical for the UI immediately after creation.
        delete (updatedUser as Partial<User>).createdAt;
      }
      return updatedUser;
    });
  };

  const updateNotificationSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setNotificationSettings(prevSettings => {
        const updatedSettings = { ...prevSettings, ...newSettings };
        try {
            localStorage.setItem('notificationSettings', JSON.stringify(updatedSettings));
        } catch (error) {
            console.error("Failed to save notification settings to localStorage", error);
        }
        return updatedSettings;
    });
  }, []);

  const updateFilters = useCallback((newFilters: Partial<FilterSettings>) => {
    setFilters(prevFilters => {
        const updatedFilters = { ...prevFilters, ...newFilters };
        try {
            localStorage.setItem('userFilters', JSON.stringify(updatedFilters));
        } catch (error) {
            console.error("Failed to save filters to localStorage", error);
        }
        return updatedFilters;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    try {
        localStorage.setItem('userFilters', JSON.stringify(initialFilters));
    } catch (error) {
        console.error("Failed to save reset filters to localStorage", error);
    }
  }, []);

  const value = {
    user,
    authUser,
    updateUser,
    notificationSettings,
    updateNotificationSettings,
    filters,
    updateFilters,
    resetFilters,
    isLoaded: isContextLoaded,
    totalUnreadCount,
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

    