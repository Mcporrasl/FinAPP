import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, indexedDBLocalPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); // CRITICAL: The app will break without this line

export const auth = getAuth(app);

// Initialize persistence dynamically to prevent auth/argument-error inside iframe / sandboxed environments
if (typeof window !== 'undefined') {
  setPersistence(auth, indexedDBLocalPersistence)
    .then(() => {
      console.log('Firebase Auth IndexedDB persistence configured successfully.');
    })
    .catch((err) => {
      console.warn('IndexedDB persistence not supported or blocked in this environment (e.g. iframe). Falling back to LocalStorage:', err);
      setPersistence(auth, browserLocalPersistence).catch((e) => {
        console.error('Failed to set LocalStorage persistence fallback:', e);
      });
    });
}
