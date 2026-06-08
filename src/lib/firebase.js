import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const configuredAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const runtimeHost = typeof window !== 'undefined' ? window.location.hostname : '';
const authDomain = runtimeHost === 'oftheday.net' || runtimeHost === 'www.oftheday.net'
  ? 'oftheday.net'
  : configuredAuthDomain;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  throw new Error(
    'Firebase is not configured. Create a .env.local file with your VITE_FIREBASE_* values ' +
    'from Firebase Console → Project Settings → Web App, then rebuild.'
  );
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
