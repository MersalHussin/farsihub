"use client";

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser, deleteUser } from 'firebase/auth';
import { doc, getDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AppUser } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUserData = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            ...firebaseUser,
            name: userData.name,
            role: userData.role,
            approved: userData.approved,
            createdAt: userData.createdAt,
            year: userData.year,
          } as AppUser);
        } else {
          // This case might happen briefly after signup before user doc is created.
          // Setting user to null forces a "not logged in" state until doc is ready.
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      setLoading(true); // Set loading to true whenever auth state changes
      fetchUserData(firebaseUser);
    });

    return () => unsubscribe();
  }, [fetchUserData]);
  
  const logout = async () => {
    await auth.signOut();
    // No need to set user to null here, onAuthStateChanged will handle it.
    router.push('/login');
  };

  const refreshUser = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
        setLoading(true);
        await fetchUserData(currentUser);
    }
  },[fetchUserData]);

  const deleteAccount = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error("No user is currently signed in.");
    }
    try {
        // 1. Delete user document from Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        await deleteDoc(userDocRef);

        // 2. Delete user from Firebase Authentication
        await deleteUser(currentUser);
        
        // Auth state will be updated by onAuthStateChanged listener
    } catch (error) {
        console.error("Error deleting account:", error);
        // This might be a re-authentication error.
        // For simplicity, we just throw, but in a real app you might handle re-authentication.
        throw error;
    }
  };

  const value = { user, loading, logout, refreshUser, deleteAccount };

  return (
    <AuthContext.Provider value={value}>
        <FirebaseErrorListener />
        {children}
    </AuthContext.Provider>
  );
};
