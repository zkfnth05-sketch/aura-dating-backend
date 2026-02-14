
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import type { User as AuthUser, RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { useUser as useAuthUserHook, useAuth, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, serverTimestamp, collection, query, where, getDoc, getDocs, updateDoc, orderBy, limit, onSnapshot, Query, DocumentData, startAfter, QueryDocumentSnapshot, documentId } from 'firebase/firestore';
import type { User, Match, Like } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

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
  countryCode: string;
  setCountryCode: (code: string) => void;
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
  firestore: any;
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
  isMatchesLoading: boolean;
  peopleILiked: User[] | null;
  peopleWhoLikedMe: User[] | null;
  isLikesLoading: boolean;
  subscribeToPushNotifications: () => Promise<void>;
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

async function fetchUsersByIds(firestore: any, userIds: string[]): Promise<User[]> {
  if (userIds.length === 0) return [];
  const users: User[] = [];
  const CHUNK_SIZE = 30; 
  for (let i = 0; i < userIds.length; i += CHUNK_SIZE) {
    const chunk = userIds.slice(i, i + CHUNK_SIZE);
    if (chunk.length > 0) {
      const usersQuery = query(collection(firestore, 'users'), where(documentId(), 'in', chunk));
      const userDocs = await getDocs(usersQuery);
      users.push(...userDocs.docs.map(d => d.data() as User));
    }
  }
  return users;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { user: authUser, isUserLoading: isAuthLoading } = useAuthUserHook();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(initialSettings);
  const [filters, setFilters] = useState<FilterSettings>(initialFilters);
  const [isUserDocLoading, setIsUserDocLoading] = useState(true);
  const [areSettingsLoaded, setAreSettingsLoaded] = useState(false); // New state to track settings loading
  const [isSignupFlowActive, setIsSignupFlowActive] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+82');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [reauthVerificationId, setReauthVerificationId] = useState<string | null>(null);
  
  const [peopleILiked, setPeopleILiked] = useState<User[] | null>(null);
  const [peopleWhoLikedMe, setPeopleWhoLikedMe] = useState<User[] | null>(null);
  
  const isLoaded = !isAuthLoading && !isUserDocLoading && areSettingsLoaded;

  // Load Settings from LocalStorage
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('notificationSettings');
      if (storedSettings) {
        setNotificationSettings(prev => ({ ...prev, ...JSON.parse(storedSettings) }));
      }
      const storedFilters = localStorage.getItem('userFilters');
      if (storedFilters) {
        setFilters(prev => ({ ...prev, ...JSON.parse(storedFilters) }));
      }
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
    } finally {
      setAreSettingsLoaded(true); // Signal that settings are now loaded
    }
  }, []);

  const updateNotificationSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setNotificationSettings(prevSettings => {
        const updatedSettings = { ...prevSettings, ...newSettings };
        try {
            localStorage.setItem('notificationSettings', JSON.stringify(updatedSettings));
        } catch (error) {
            console.error("Failed to save settings", error);
        }
        return updatedSettings;
    });
  }, []);

  // User Document Fetching & Presence Management
  useEffect(() => {
    if (isAuthLoading || !firestore) {
      setIsUserDocLoading(true);
      return;
    }
    if (!authUser) {
      setUser(null);
      setIsUserDocLoading(false);
      return;
    }

    const userRef = doc(firestore, 'users', authUser.uid);
    
    // Subscribe to user document
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setUser(docSnap.data() as User);
      } else {
        setUser(null);
      }
      setIsUserDocLoading(false);
    }, error => {
       console.error("Failed to fetch user document:", error);
       setUser(null);
       setIsUserDocLoading(false);
    });

    // Handle presence (lastSeen)
    const updateLastSeen = () => {
      getDoc(userRef).then(docSnap => {
        if(docSnap.exists()){
          updateDoc(userRef, { lastSeen: new Date().toISOString() })
            .catch(e => console.error("Error updating lastSeen:", e));
        }
      });
    };
    
    window.addEventListener('focus', updateLastSeen);
    updateLastSeen(); // Update once on load
    
    return () => {
      unsubscribe();
      window.removeEventListener('focus', updateLastSeen);
    };
  }, [authUser, firestore, isAuthLoading]);

  // Dedicated useEffect for location management
  useEffect(() => {
    // Wait for everything to be ready
    if (!isLoaded || !user || !firestore) {
      return;
    }
    
    if (notificationSettings.locationShared) {
      const userRef = doc(firestore, 'users', user.id);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateDoc(userRef, { lat: latitude, lng: longitude })
            .catch(e => console.error("Error updating location:", e));
        },
        (error) => {
          console.warn("Geolocation error:", error.message);
          if (error.code === error.PERMISSION_DENIED) {
            toast({
              variant: "destructive",
              title: "위치 권한 거부됨",
              description: "위치 서비스를 사용하려면 브라우저 설정에서 권한을 허용해주세요.",
            });
            // Sync the UI toggle with the browser's reality
            updateNotificationSettings({ locationShared: false });
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, [isLoaded, user, firestore, notificationSettings.locationShared, updateNotificationSettings, toast]);


  // --- Matches & Likes Queries ---
  const matchesQuery = useMemoFirebase(() => {
    if (!user?.id || !firestore) return null;
    return query(collection(firestore, "matches"), where("users", "array-contains", user.id));
  }, [user?.id, firestore]);
  const { data: matches, isLoading: isMatchesLoading } = useCollection<Match>(matchesQuery);
  
  const myLikesQuery = useMemoFirebase(() => {
    if (!user?.id || !firestore) return null;
    return query(collection(firestore, 'likes'), where('likerId', '==', user.id), where('isLike', '==', true));
  }, [user?.id, firestore]);
  const { data: myLikes, isLoading: isMyLikesLoading } = useCollection<Like>(myLikesQuery);

  const likesToMeQuery = useMemoFirebase(() => {
      if (!user?.id || !firestore) return null;
      return query(collection(firestore, 'likes'), where('likeeId', '==', user.id), where('isLike', '==', true));
  }, [user?.id, firestore]);
  const { data: likesToMe, isLoading: isLikesToMeLoading } = useCollection<Like>(likesToMeQuery);

  const isLikesLoading = isMyLikesLoading || isLikesToMeLoading;

  // Process Likes Data (Converted to Users)
  useEffect(() => {
    const fetchLikeUsers = async () => {
        if (!firestore) return;
        // Don't run if myLikes are still loading.
        if (myLikes === null) return;
        
        if (myLikes.length > 0) {
            const ids = myLikes.map(l => l.likeeId);
            const users = await fetchUsersByIds(firestore, ids);
            setPeopleILiked(users);
        } else {
            setPeopleILiked([]);
        }
    };
    fetchLikeUsers();
  }, [myLikes, firestore]);
  
  useEffect(() => {
    const fetchLikedByUsers = async () => {
        if (!firestore) return;
        if (likesToMe === null) return;

        if (likesToMe.length > 0) {
            const ids = likesToMe.map(l => l.likerId);
            const users = await fetchUsersByIds(firestore, ids);
            setPeopleWhoLikedMe(users);
        } else {
            setPeopleWhoLikedMe([]);
        }
    };
    fetchLikedByUsers();
  }, [likesToMe, firestore]);

  const totalUnreadCount = (matches || []).reduce((acc, match) => {
    if (user && user.id && match.unreadCounts) {
      return acc + (match.unreadCounts[user.id] || 0);
    }
    return acc;
  }, 0);

  const updateUser = useCallback((newUserData: Partial<User>): Promise<void> => {
    if (!authUser || !firestore) {
      return Promise.reject(new Error("User not authenticated."));
    }
    const userRef = doc(firestore, 'users', authUser.uid);
    const dataToSave: any = { ...newUserData, id: authUser.uid };
    if (newUserData.createdAt === "serverTimestamp") {
      dataToSave.createdAt = serverTimestamp();
    }
    // Return the promise from the non-blocking call
    return setDocumentNonBlocking(userRef, dataToSave, { merge: true });
  }, [authUser, firestore]);
  
  const updateFilters = useCallback((newFilters: Partial<FilterSettings>) => {
    setFilters(prevFilters => {
        const updatedFilters = { ...prevFilters, ...newFilters };
        try {
            localStorage.setItem('userFilters', JSON.stringify(updatedFilters));
        } catch (error) {
            console.error("Failed to save filters", error);
        }
        return updatedFilters;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    try {
        localStorage.setItem('userFilters', JSON.stringify(initialFilters));
    } catch (error) {
        console.error("Failed to reset filters", error);
    }
  }, []);

  const setupRecaptcha = useCallback((container: HTMLElement) => {
    if (auth) {
        const { RecaptchaVerifier } = require('firebase/auth');
        const verifier = new RecaptchaVerifier(auth, container, { size: 'invisible' });
        setRecaptchaVerifier(verifier);
      }
  }, [auth]);

  const sendVerificationCode = useCallback(async (phoneNumberOverride?: string) => {
    // If override is provided, use it directly (for re-auth). Otherwise, construct from state.
    const fullPhoneNumber = phoneNumberOverride || `${countryCode}${phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber}`;
    
    if (recaptchaVerifier && fullPhoneNumber) {
        setIsSendingOtp(true);
        try {
            const { signInWithPhoneNumber } = require('firebase/auth');
            const confirmation = await signInWithPhoneNumber(auth, fullPhoneNumber, recaptchaVerifier);
            setConfirmationResult(confirmation);
            setReauthVerificationId(confirmation.verificationId);
            // Only navigate if we're in the initial signup flow
            if(!phoneNumberOverride) {
              router.push('/signup/otp');
            }
            return confirmation.verificationId;
        } catch (error) {
            console.error("SMS Error:", error);
            alert("인증 코드 전송 실패. 전화번호를 확인해주세요.");
        } finally {
            setIsSendingOtp(false);
        }
    }
  }, [auth, phoneNumber, countryCode, recaptchaVerifier, router]);

  const verifyOtp = useCallback(async (otp: string) => {
    if (confirmationResult && otp) {
        setIsVerifyingOtp(true);
        try {
          await confirmationResult.confirm(otp);
          router.push('/signup/profile');
        } catch (error) {
          console.error("OTP Error:", error);
          alert("인증 코드가 잘못되었습니다.");
        } finally {
          setIsVerifyingOtp(false);
        }
      }
  }, [confirmationResult, router]);
  
  const reauthenticate = useCallback(async (otp: string) => {
    if (!reauthVerificationId || !otp || !authUser) throw new Error("인증 정보 부족");
      setIsVerifyingOtp(true);
      try {
          const { PhoneAuthProvider, reauthenticateWithCredential } = require('firebase/auth');
          const credential = PhoneAuthProvider.credential(reauthVerificationId, otp);
          await reauthenticateWithCredential(authUser, credential);
      } catch (error) {
          console.error("Reauth Error:", error);
          throw new Error("인증 실패");
      } finally {
          setIsVerifyingOtp(false);
      }
  }, [reauthVerificationId, authUser]);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPushNotifications = useCallback(async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          toast({ variant: 'destructive', title: '푸시 알림 미지원', description: '이 브라우저는 푸시 알림을 지원하지 않습니다.' });
          return;
      }
      if (!user || !firestore) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            const isAlreadySaved = user.pushSubscriptions?.some(sub => sub.endpoint === subscription!.endpoint);
            if (!isAlreadySaved) {
                await updateUser({ pushSubscriptions: [...(user.pushSubscriptions || []), subscription.toJSON()] });
            }
            toast({ title: '알림이 설정되었습니다.' });
            return;
        }

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
            console.error('VAPID public key is not defined in .env file.');
            toast({ variant: 'destructive', title: '설정 오류', description: '푸시 알림 설정에 오류가 발생했습니다.' });
            return;
        }

        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
        });

        await updateUser({
            pushSubscriptions: [...(user.pushSubscriptions || []), subscription.toJSON()]
        });
        
        toast({ title: '알림이 성공적으로 설정되었습니다.' });
      } catch (error) {
          console.error('Failed to subscribe to push notifications:', error);
          toast({ variant: 'destructive', title: '구독 실패', description: '푸시 알림 구독에 실패했습니다. 다시 시도해주세요.' });
      }
  }, [user, firestore, updateUser, toast]);


  const value: UserContextType = {
    user, authUser, firestore, updateUser, notificationSettings, updateNotificationSettings,
    filters, updateFilters, resetFilters, isLoaded,
    totalUnreadCount, phoneAuth: { phoneNumber, setPhoneNumber, countryCode, setCountryCode, confirmationResult, recaptchaVerifier, setupRecaptcha, sendVerificationCode, verifyOtp, reauthenticate, isSendingOtp, isVerifyingOtp },
    isSignupFlowActive, setIsSignupFlowActive,
    matches, isMatchesLoading, peopleILiked, peopleWhoLikedMe, isLikesLoading,
    subscribeToPushNotifications
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
