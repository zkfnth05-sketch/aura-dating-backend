'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { User as AuthUser, RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { useUser as useAuthUserHook, useAuth, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp, collection, query, where, getDoc, getDocs, updateDoc, collectionGroup, documentId, orderBy, limit, addDoc } from 'firebase/firestore';
import type { User, Match, Like } from '@/lib/types';
import { useRouter } from 'next/navigation';

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

interface PhoneAuthState {
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  confirmationResult: ConfirmationResult | null;
  recaptchaVerifier: RecaptchaVerifier | null;
  setupRecaptcha: (container: HTMLElement) => void;
  sendVerificationCode: (phoneNumberOverride?: string) => Promise<string | undefined>;
  verifyOtp: (otp: string) => Promise<void>;
  reauthenticate: (otp: string) => Promise<void>;
  isSendingOtp: boolean;
  isVerifyingOtp: boolean;
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
  totalUnreadCount: number;
  phoneAuth: PhoneAuthState;
  isSignupFlowActive: boolean;
  setIsSignupFlowActive: (isActive: boolean) => void;
  matches: Match[] | null;
  likes: Like[] | null;
  isLikesLoading: boolean;
  isMatchesLoading: boolean;
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
  const { user: authUser, isUserLoading: isAuthLoading } = useAuthUserHook();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(initialSettings);
  const [filters, setFilters] = useState<FilterSettings>(initialFilters);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSignupFlowActive, setIsSignupFlowActive] = useState(false);

  // Phone Auth State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [reauthVerificationId, setReauthVerificationId] = useState<string | null>(null);


  useEffect(() => {
    let isMounted = true;

    const manageUserFlow = async () => {
      if (isAuthLoading) return;
      if (!authUser) {
        setUser(null);
        setIsLoaded(true);
        return;
      }

      if (firestore) {
        const userRef = doc(firestore, 'users', authUser.uid);
        try {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              updateDoc(userRef, { lat: latitude, lng: longitude, lastSeen: new Date().toISOString() });
            },
            () => { updateDoc(userRef, { lastSeen: new Date().toISOString() }); },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
          const userSnap = await getDoc(userRef);
          if (isMounted) {
            if (userSnap.exists()) {
              const userData = userSnap.data() as User;
              setUser(userData);
            } else {
              setUser(null);
            }
          }
        } catch (error) {
          console.error("Failed to fetch user document:", error);
          if (isMounted) setUser(null);
        }
      }
      
      if (isMounted) setIsLoaded(true);
    };

    manageUserFlow();
    return () => { isMounted = false; };
  }, [authUser, firestore, isAuthLoading]);

  // Load settings from localStorage once on mount
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('notificationSettings');
      if (storedSettings) setNotificationSettings(JSON.parse(storedSettings));
      const storedFilters = localStorage.getItem('userFilters');
      if (storedFilters) setFilters(JSON.parse(storedFilters));
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
    }
  }, []);

  const matchesQuery = useMemoFirebase(() => {
    if (!user?.id || !firestore) return null;
    return query(collection(firestore, "matches"), where("users", "array-contains", user.id));
  }, [user?.id, firestore]);
  const { data: matches, isLoading: isMatchesLoading } = useCollection<Match>(matchesQuery);

  const likesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "likes"));
  }, [firestore]);
  const { data: likes, isLoading: isLikesLoading } = useCollection<Like>(likesQuery);

  const totalUnreadCount = (matches || []).reduce((acc, match) => {
    if (user && user.id && match.unreadCounts) {
      return acc + (match.unreadCounts[user.id] || 0);
    }
    return acc;
  }, 0);

  const updateUser = useCallback(async (newUserData: Partial<User>) => {
    if (!authUser || !firestore) {
      console.error("Auth user or Firestore not available for update.");
      return Promise.reject(new Error("User not authenticated."));
    };
  
    const userRef = doc(firestore, 'users', authUser.uid);
  
    const dataToSave: any = { ...newUserData, id: authUser.uid };
    
    if (newUserData.createdAt) {
      dataToSave.createdAt = serverTimestamp();
    }
  
    setDocumentNonBlocking(userRef, dataToSave, { merge: true });
  
    setUser(prevUser => {
      const updatedUser = { ...(prevUser || {}), ...dataToSave } as User;
      if (newUserData.createdAt) {
        delete (updatedUser as Partial<User>).createdAt;
      }
      return updatedUser;
    });
    
    return Promise.resolve();
  }, [authUser, firestore]);

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

  // --- Phone Auth Logic ---
  const setupRecaptcha = useCallback((container: HTMLElement) => {
    if (auth && !recaptchaVerifier) {
      const { RecaptchaVerifier } = require('firebase/auth');
      const verifier = new RecaptchaVerifier(auth, container, {
        size: 'invisible',
      });
      setRecaptchaVerifier(verifier);
    }
  }, [auth, recaptchaVerifier]);

  const sendVerificationCode = useCallback(async (phoneNumberOverride?: string) => {
    let targetPhoneNumber = phoneNumberOverride || phoneNumber;
    if (recaptchaVerifier && targetPhoneNumber) {
      
      if (targetPhoneNumber.startsWith('0')) {
        targetPhoneNumber = `+82${targetPhoneNumber.substring(1)}`;
      }

      setIsSendingOtp(true);
      try {
        const { signInWithPhoneNumber } = require('firebase/auth');
        const confirmation = await signInWithPhoneNumber(auth, targetPhoneNumber, recaptchaVerifier);
        setConfirmationResult(confirmation);
        setReauthVerificationId(confirmation.verificationId);
        if(!phoneNumberOverride) {
            router.push('/signup/otp');
        }
        return confirmation.verificationId;
      } catch (error) {
        console.error("SMS 전송 실패:", error);
        alert("인증 코드 전송에 실패했습니다. 전화번호를 확인하고 다시 시도해주세요.");
      } finally {
        setIsSendingOtp(false);
      }
    }
  }, [auth, phoneNumber, recaptchaVerifier, router]);

  const verifyOtp = useCallback(async (otp: string) => {
    if (confirmationResult && otp) {
      setIsVerifyingOtp(true);
      try {
        await confirmationResult.confirm(otp);
        router.push('/signup/profile');
      } catch (error) {
        console.error("OTP 인증 실패:", error);
        alert("인증 코드가 잘못되었습니다. 다시 확인해주세요.");
      } finally {
        setIsVerifyingOtp(false);
      }
    }
  }, [confirmationResult, router]);
  
  const reauthenticate = useCallback(async (otp: string) => {
    if (!reauthVerificationId || !otp || !authUser) {
      throw new Error("인증 정보가 부족합니다.");
    }
    setIsVerifyingOtp(true);
    try {
        const { PhoneAuthProvider } = require('firebase/auth');
        const credential = PhoneAuthProvider.credential(reauthVerificationId, otp);
        const { reauthenticateWithCredential } = require('firebase/auth');
        await reauthenticateWithCredential(authUser, credential);
    } catch (error) {
        console.error("재인증 실패:", error);
        throw new Error("인증 코드가 잘못되었습니다. 다시 시도해주세요.");
    } finally {
        setIsVerifyingOtp(false);
    }
  }, [reauthVerificationId, authUser]);
  // --- End Phone Auth Logic ---

  const value: UserContextType = {
    user,
    authUser,
    updateUser,
    notificationSettings,
    updateNotificationSettings,
    filters,
    updateFilters,
    resetFilters,
    isLoaded,
    totalUnreadCount,
    phoneAuth: {
      phoneNumber,
      setPhoneNumber,
      confirmationResult,
      recaptchaVerifier,
      setupRecaptcha,
      sendVerificationCode,
      verifyOtp,
      reauthenticate,
      isSendingOtp,
      isVerifyingOtp,
    },
    isSignupFlowActive,
    setIsSignupFlowActive,
    matches,
    likes,
    isLikesLoading,
    isMatchesLoading,
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
