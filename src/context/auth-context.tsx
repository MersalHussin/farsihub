"use client";

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser, deleteUser, updateProfile } from 'firebase/auth';
import { doc, getDoc, Timestamp, deleteDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';
import type { AppUser } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

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
  const router = useRouter();
  const pathname = usePathname();

  const fetchUserData = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      const db = getFirebaseDb();
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
        // User exists in Auth, but not in Firestore. This is an inconsistent state.
        // Log them out.
        const auth = getFirebaseAuth();
        await auth.signOut();
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        await fetchUserData(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserData]);
  
  useEffect(() => {
    if (loading) return; // Don't do anything while loading

    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');

    if (user) {
      // User is logged in
      if (isAuthPage) {
         // Redirect from auth pages to dashboard if logged in
         router.replace('/dashboard');
      }
    } else {
      // User is not logged in
      const protectedPaths = ['/dashboard', '/admin', '/student', '/lectures', '/assignments', '/quizzes'];
      const isProtected = protectedPaths.some(path => pathname.startsWith(path));
      
      if (isProtected) {
        router.replace('/login');
      }
    }

  }, [user, loading, pathname, router]);

  const logout = async () => {
    const auth = getFirebaseAuth();
    await auth.signOut();
    // onAuthStateChanged will handle setting user to null
    // The useEffect above will handle redirection
  };

  const refreshUser = useCallback(async () => {
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
        setLoading(true);
        await currentUser.reload(); // Reloads user from Firebase Auth
        await fetchUserData(currentUser); // Fetches user data from Firestore
        setLoading(false);
    }
  },[fetchUserData]);

  const deleteAccount = async () => {
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error("No user is currently signed in.");
    }
    try {
        const db = getFirebaseDb();
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
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error("No user is currently signed in.");
    }
    try {
        await updateProfile(currentUser, { photoURL });
        const db = getFirebaseDb();
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
        <FirebaseErrorListener />
        {children}
    </AuthContext.Provider>
  );
};
