'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import type { User as AuthUser, RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { useUser as useAuthUserHook, useAuth, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, serverTimestamp, collection, query, where, getDoc, getDocs, updateDoc, orderBy, limit, onSnapshot, Query, DocumentData, startAfter, QueryDocumentSnapshot, documentId } from 'firebase/firestore';
import type { User, Match, Like } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

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
  isMatchesLoading: boolean;
  peopleILiked: User[] | null;
  peopleWhoLikedMe: User[] | null;
  isLikesLoading: boolean;
  
  // Home Page Client State
  recommendedUsers: User[];
  isRecommendedUsersLoading: boolean;
  fetchNextRecommendedUsers: () => void;
  hasMoreRecommendedUsers: boolean;
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

const FETCH_LIMIT = 20;

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

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(initialSettings);
  const [filters, setFilters] = useState<FilterSettings>(initialFilters);
  const [isUserDocLoading, setIsUserDocLoading] = useState(true);
  const [isSignupFlowActive, setIsSignupFlowActive] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [reauthVerificationId, setReauthVerificationId] = useState<string | null>(null);
  
  const [peopleILiked, setPeopleILiked] = useState<User[] | null>(null);
  const [peopleWhoLikedMe, setPeopleWhoLikedMe] = useState<User[] | null>(null);
  
  // --- Recommendation States ---
  const [recommendedUsers, setRecommendedUsers] = useState<User[]>([]);
  const [isRecommendedUsersLoading, setIsRecommendedUsersLoading] = useState(true);
  
  // Refs for Pagination Stability (Prevents Infinite Loops)
  const lastVisibleRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const hasMoreRef = useRef(true);
  const isLoadingMoreRef = useRef(false);
  const [hasMoreState, setHasMoreState] = useState(true); // For UI consumption

  // User Document Fetching
  useEffect(() => {
    let isMounted = true;
    if (isAuthLoading) {
      setIsUserDocLoading(true);
      return;
    }
    if (!authUser) {
      setUser(null);
      setIsUserDocLoading(false);
      return;
    }
  
    if (firestore) {
      const userRef = doc(firestore, 'users', authUser.uid);
      const updateUserPresence = () => {
        getDoc(userRef).then(docSnap => {
          if (docSnap.exists()) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                updateDoc(userRef, { lat: latitude, lng: longitude, lastSeen: new Date().toISOString() }).catch(e => console.error("Error updating presence:", e));
              },
              () => { 
                updateDoc(userRef, { lastSeen: new Date().toISOString() }).catch(e => console.error("Error updating presence:", e));
              },
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
          }
        });
      };
  
      getDoc(userRef).then(docSnap => {
        if (!isMounted) return;
        if (docSnap.exists()) {
          const userData = docSnap.data() as User;
          setUser(userData);
          updateUserPresence();
        } else {
          setUser(null);
        }
        setIsUserDocLoading(false);
      }).catch(error => {
        console.error("Failed to fetch user document:", error);
        if (isMounted) {
          setUser(null);
          setIsUserDocLoading(false);
        }
      });
  
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (!isMounted) return;
        if (docSnap.exists()) {
          setUser(docSnap.data() as User);
        } else {
          setUser(null);
        }
      });
      
      const handleFocus = () => updateUserPresence();
      window.addEventListener('focus', handleFocus);
  
      return () => {
        isMounted = false;
        unsubscribe();
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [authUser?.uid, firestore, isAuthLoading]);

  // Load Settings from LocalStorage
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

  // --- Matches & Likes Queries ---
  const matchesQuery = useMemoFirebase(() => {
    if (!user?.id || !firestore) return null;
    return query(collection(firestore, "matches"), where("users", "array-contains", user.id));
  }, [user?.id, firestore]);
  const { data: matches, isLoading: isMatchesLoading } = useCollection<Match>(matchesQuery);
  
  const myLikesQuery = useMemoFirebase(() => {
    if (!user?.id || !firestore) return null;
    return query(collection(firestore, 'likes'), where('likerId', '==', user.id));
  }, [user?.id, firestore]);
  const { data: myLikes, isLoading: isMyLikesLoading } = useCollection<Like>(myLikesQuery);

  const likesToMeQuery = useMemoFirebase(() => {
      if (!user?.id || !firestore) return null;
      return query(collection(firestore, 'likes'), where('likeeId', '==', user.id));
  }, [user?.id, firestore]);
  const { data: likesToMe, isLoading: isLikesToMeLoading } = useCollection<Like>(likesToMeQuery);

  const isLikesLoading = isMyLikesLoading || isLikesToMeLoading;

  // Process Likes Data (Converted to Users)
  useEffect(() => {
    const fetchLikeUsers = async () => {
        if (!firestore || isLikesLoading) return;
        
        if (!myLikes) setPeopleILiked([]);
        if (!likesToMe) setPeopleWhoLikedMe([]);

        if (myLikes && myLikes.length > 0) {
            const ids = myLikes.filter(l => l.isLike).map(l => l.likeeId);
            const users = await fetchUsersByIds(firestore, ids);
            setPeopleILiked(users);
        }
        if (likesToMe && likesToMe.length > 0) {
            const ids = likesToMe.filter(l => l.isLike).map(l => l.likerId);
            const users = await fetchUsersByIds(firestore, ids);
            setPeopleWhoLikedMe(users);
        }
    };
    fetchLikeUsers();
  }, [myLikes, likesToMe, firestore, isLikesLoading]);


  // --- Recommendation Logic (Fixed) ---
  
  const fetchNextRecommendedUsers = useCallback(async () => {
    // Check refs instead of state to avoid dependency loops
    if (isLoadingMoreRef.current || !hasMoreRef.current || !user || !firestore || !myLikes) {
      return;
    }
    
    isLoadingMoreRef.current = true;

    try {
        const iLikedIds = myLikes.filter(l => l.isLike).map(l => l.likeeId);
        const interactedUserIds = new Set(iLikedIds);
        interactedUserIds.add(user.id);
        
        let newUsers: User[] = [];
        let lastDocForNextBatch = lastVisibleRef.current;
        let keepFetching = true;

        while (newUsers.length < FETCH_LIMIT && keepFetching) {
            let usersQuery: Query<DocumentData> = query(
                collection(firestore, 'users'),
                orderBy('createdAt', 'desc'),
                limit(FETCH_LIMIT * 2) 
            );

            if (lastDocForNextBatch) {
                usersQuery = query(usersQuery, startAfter(lastDocForNextBatch));
            }
            
            const snapshot = await getDocs(usersQuery);

            if (snapshot.empty) {
                hasMoreRef.current = false;
                setHasMoreState(false);
                keepFetching = false;
                break;
            }

            lastDocForNextBatch = snapshot.docs[snapshot.docs.length - 1];
            const potentialUsers = snapshot.docs.map(doc => doc.data() as User);
            
            const newlyFilteredUsers = potentialUsers.filter(u => {
                if (interactedUserIds.has(u.id)) return false;
                if (recommendedUsers.some(rec => rec.id === u.id)) return false; // Client-side dupe check

                let genderFilter: ('남성' | '여성' | '기타')[] = filters.gender;
                if (genderFilter.length === 0) {
                    genderFilter = user.gender === '남성' ? ['여성'] : (user.gender === '여성' ? ['남성'] : []);
                }
                if (genderFilter.length > 0 && !genderFilter.includes(u.gender)) return false;
                if (u.age < filters.ageRange.min || u.age > filters.ageRange.max) return false;
                
                const checkTags = (userTags: string[] = [], filterTags: string[]) => 
                    filterTags.length === 0 || filterTags.every(tag => userTags.includes(tag));
                
                return (
                    checkTags(u.relationship, filters.relationship) &&
                    checkTags(u.values, filters.values) &&
                    checkTags(u.communication, filters.communication) &&
                    checkTags(u.lifestyle, filters.lifestyle) &&
                    checkTags(u.hobbies, filters.hobbies) &&
                    checkTags(u.interests, filters.interests)
                );
            });
            
            newUsers = [...newUsers, ...newlyFilteredUsers];
            
            // Safety break if we fetched tons but found nothing matching filters
            if (snapshot.docs.length < FETCH_LIMIT * 2 && newUsers.length === 0) {
                 // Might want to continue, but usually indicates end of relevant stream
            }
        }

        lastVisibleRef.current = lastDocForNextBatch;

        if (newUsers.length > 0) {
            setRecommendedUsers(prev => {
                const existingIds = new Set(prev.map(u => u.id));
                const uniqueNewUsers = newUsers.filter(u => !existingIds.has(u.id));
                return [...prev, ...uniqueNewUsers];
            });
        }

    } catch (e) {
        console.error("Error fetching more recommended users:", e);
    } finally {
        isLoadingMoreRef.current = false;
    }
  }, [user, firestore, filters, myLikes, recommendedUsers]); // Note: myLikes is here, but effect below handles triggering

  // Main Effect: Initialize or Reset Recommendations
  // This runs ONLY when Filters change or User/DB is first loaded.
  // It does NOT run when 'myLikes' changes (preventing the loop).
  useEffect(() => {
    const initializeRecommendations = async () => {
        if (isLikesLoading || !firestore || !user || !myLikes) {
            return;
        }

        setIsRecommendedUsersLoading(true);
        setRecommendedUsers([]); // Clear list
        lastVisibleRef.current = null; // Reset cursor
        hasMoreRef.current = true;
        setHasMoreState(true);
        isLoadingMoreRef.current = false;

        // Perform initial fetch
        await fetchNextRecommendedUsers();
        
        setIsRecommendedUsersLoading(false);
    };

    // Use stringified filters to detect value changes, not reference changes
    const filterKey = JSON.stringify(filters);

    initializeRecommendations();
    
    // Explicitly exclude fetchNextRecommendedUsers and myLikes to prevent loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore, user, isLikesLoading, JSON.stringify(filters)]); 


  const totalUnreadCount = (matches || []).reduce((acc, match) => {
    if (user && user.id && match.unreadCounts) {
      return acc + (match.unreadCounts[user.id] || 0);
    }
    return acc;
  }, 0);

  const updateUser = useCallback(async (newUserData: Partial<User>) => {
    if (!authUser || !firestore) return Promise.reject(new Error("User not authenticated."));
    const userRef = doc(firestore, 'users', authUser.uid);
    const dataToSave: any = { ...newUserData, id: authUser.uid };
    if (newUserData.createdAt === "serverTimestamp") {
        dataToSave.createdAt = serverTimestamp();
    }
    return setDocumentNonBlocking(userRef, dataToSave, { merge: true });
  }, [authUser, firestore]);
  

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
    if (auth && !recaptchaVerifier) {
        const { RecaptchaVerifier } = require('firebase/auth');
        const verifier = new RecaptchaVerifier(auth, container, { size: 'invisible' });
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
            if(!phoneNumberOverride) router.push('/signup/otp');
            return confirmation.verificationId;
        } catch (error) {
            console.error("SMS Error:", error);
            alert("인증 코드 전송 실패. 전화번호를 확인해주세요.");
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

  const value: UserContextType = {
    user, authUser, updateUser, notificationSettings, updateNotificationSettings,
    filters, updateFilters, resetFilters, isLoaded: !isAuthLoading && !isUserDocLoading,
    totalUnreadCount, phoneAuth: { phoneNumber, setPhoneNumber, confirmationResult, recaptchaVerifier, setupRecaptcha, sendVerificationCode, verifyOtp, reauthenticate, isSendingOtp, isVerifyingOtp },
    isSignupFlowActive, setIsSignupFlowActive,
    matches, isMatchesLoading, peopleILiked, peopleWhoLikedMe, isLikesLoading,
    
    // Exports for Home Page Client
    recommendedUsers,
    isRecommendedUsersLoading,
    fetchNextRecommendedUsers,
    hasMoreRecommendedUsers: hasMoreState,
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
