import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
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
// Persistent (IndexedDB) cache, not the default memory-only cache.
//
// School wifi drops constantly. Firebase Auth keeps its own session in
// IndexedDB, so a teacher stays signed in offline — but every Firestore read
// used to go to the network, hang for ~10s, and throw. That is what bounced a
// signed-in teacher to /login mid-morning-meeting (see the catch in App.jsx).
// With a persistent cache the user doc and saved routines are served from disk
// and writes queue until the network returns.
//
// persistentMultipleTabManager is required, not optional: projector mode opens
// a second window (?projector=1) which imports this module too. Single-tab
// persistence would fail its lock acquisition with 'failed-precondition'.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
export const functions = getFunctions(app);
