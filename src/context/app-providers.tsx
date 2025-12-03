"use client";

import { createContext, useState, useEffect, ReactNode, useCallback, useContext } from 'react';
import { onAuthStateChanged, User as FirebaseUser, deleteUser, updateProfile } from 'firebase/auth';
import { doc, getDoc, Timestamp, deleteDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';
import type { AppUser } from '@/lib/types';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { GlobalLoadingIndicator } from '@/components/GlobalLoadingIndicator';
import { useAuth } from '@/hooks/use-auth';

// --- Auth Context Logic ---

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateProfilePicture: (photoURL: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      const db = getFirebaseDb();
      if (!db) throw new Error("Firestore is not initialized.");

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const appUser = {
            ...firebaseUser,
            name: userData.name,
            role: userData.role,
            approved: userData.approved,
            createdAt: userData.createdAt,
            year: userData.year,
        } as AppUser;
        setUser(appUser);
        return appUser;
      } else {
        const auth = getFirebaseAuth();
        if (auth) await auth.signOut();
        setUser(null);
        return null;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      console.error("Firebase Auth is not initialized. Check your environment variables.");
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setLoading(true);
        await fetchUserData(firebaseUser);
        setLoading(false);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchUserData]);
  
  const logout = async () => {
    const auth = getFirebaseAuth();
    if (auth) {
      await auth.signOut();
      setUser(null);
    }
  };

  const refreshUser = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    const currentUser = auth.currentUser;
    if (currentUser) {
        setLoading(true);
        await currentUser.reload(); 
        await fetchUserData(currentUser); 
        setLoading(false);
    }
  },[fetchUserData]);

  const deleteAccount = async () => {
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    if (!auth || !db) throw new Error("Firebase is not initialized.");

    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error("No user is currently signed in.");
    }
    try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await deleteDoc(userDocRef);
        await deleteUser(currentUser);
    } catch (error) {
        console.error("Error deleting account:", error);
        throw error;
    }
  };

  const updateProfilePicture = async (photoURL: string) => {
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    if (!auth || !db) throw new Error("Firebase is not initialized.");

    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error("No user is currently signed in.");
    }
    try {
        await updateProfile(currentUser, { photoURL });
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, { photoURL });
        await refreshUser();
    } catch (error) {
        console.error("Error updating profile picture:", error);
        throw error;
    }
  };


  const value = { user, loading, logout, refreshUser, deleteAccount, updateProfilePicture };

  return (
    <AuthContext.Provider value={value}>
        {children}
    </AuthContext.Provider>
  );
};


// --- App Content Logic ---

function GlobalLoadingWrapper({ children }: { children: React.ReactNode }) {
    const { loading } = useAuth();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // We only render the loading indicator on the client after the initial mount.
    // This prevents any hydration mismatch.
    if (!isMounted || !loading) {
        return <>{children}</>;
    }

    return (
        <>
            <GlobalLoadingIndicator />
            {children}
        </>
    );
}


export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <FirebaseErrorListener />
            <GlobalLoadingWrapper>
                {children}
            </GlobalLoadingWrapper>
        </AuthProvider>
    )
}
