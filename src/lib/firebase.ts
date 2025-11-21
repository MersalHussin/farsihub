import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

function initializeFirebase() {
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
}

// This function can be called to ensure Firebase is initialized.
// It's safe to call this multiple times.
const ensureFirebaseInitialized = () => {
    if (!getApps().length) {
        initializeFirebase();
    }
};

// Export getters that ensure initialization before returning instances.
export const getFirebaseApp = (): FirebaseApp => {
    ensureFirebaseInitialized();
    return app;
}

export const getFirebaseAuth = (): Auth => {
    ensureFirebaseInitialized();
    return auth;
}

export const getFirebaseDb = (): Firestore => {
    ensureFirebaseInitialized();
    return db;
}
