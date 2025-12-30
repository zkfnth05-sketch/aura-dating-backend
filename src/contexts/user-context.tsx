'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { User as AuthUser, RecaptchaVerifier, ConfirmationResult, PhoneAuthProvider, PhoneAuthCredential } from 'firebase/auth';
import { useUser as useAuthUserHook, useAuth, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp, collection, query, where, getDoc } from 'firebase/firestore';
import type { User, Match } from '@/lib/types';
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
  const { user: authUser, isUserLoading } = useAuthUserHook();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(initialSettings);
  const [filters, setFilters] = useState<FilterSettings>(initialFilters);
  const [isContextLoaded, setIsContextLoaded] = useState(false);
  const [isSignupFlowActive, setIsSignupFlowActive] = useState(false);


  // Phone Auth State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [reauthVerificationId, setReauthVerificationId] = useState<string | null>(null);


  // Load user data from Firestore
  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
        if (authUser && firestore) {
            const userRef = doc(firestore, 'users', authUser.uid);
            try {
                const userSnap = await getDoc(userRef);
                if (isMounted) {
                    if (userSnap.exists()) {
                        setUser(userSnap.data() as User);
                    } else {
                        setUser(null);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch user document:", error);
                if (isMounted) setUser(null);
            }
        } else if (!isUserLoading && isMounted) {
            setUser(null);
        }
    };
    
    fetchUser();
    return () => { isMounted = false };
}, [authUser, firestore, isUserLoading]);

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
      // isContextLoaded is true once the initial auth state check is complete.
      if (!isUserLoading) {
          setIsContextLoaded(true);
      }
  }, [isUserLoading]);

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

  const updateUser = useCallback(async (newUserData: Partial<User>) => {
    if (!authUser || !firestore) {
      console.error("Auth user or Firestore not available for update.");
      return Promise.reject(new Error("User not authenticated."));
    };
  
    const userRef = doc(firestore, 'users', authUser.uid);
  
    const dataToSave: any = { ...newUserData, id: authUser.uid };
    
    // Check if this is the initial profile creation
    if (newUserData.createdAt) {
      dataToSave.createdAt = serverTimestamp();
    }
  
    setDocumentNonBlocking(userRef, dataToSave, { merge: true });
  
    setUser(prevUser => {
      const updatedUser = { ...(prevUser || {}), ...dataToSave } as User;
      // Don't set createdAt on local user object as it's a server value
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
      
      // Format number to E.164 for Firebase
      if (targetPhoneNumber.startsWith('0')) {
        targetPhoneNumber = `+82${targetPhoneNumber.substring(1)}`;
      }

      setIsSendingOtp(true);
      try {
        const { signInWithPhoneNumber } = require('firebase/auth');
        const confirmation = await signInWithPhoneNumber(auth, targetPhoneNumber, recaptchaVerifier);
        setConfirmationResult(confirmation);
        setReauthVerificationId(confirmation.verificationId);
        if(!phoneNumberOverride) { // Don't redirect on re-auth
            setIsSignupFlowActive(true);
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
        // Auth state change will be handled by the main listener
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
    isLoaded: isContextLoaded,
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
