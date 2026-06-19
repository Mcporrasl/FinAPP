import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, indexedDBLocalPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); // CRITICAL: The app will break without this line

export const auth = getAuth(app);

// Initialize persistence dynamically to prevent auth/argument-error inside iframe / sandboxed environments
if (typeof window !== 'undefined') {
  // iOS and PWA standalone modes have bugs with IndexedDB persistence in WebKit Web.app container.
  // We force browserLocalPersistence (LocalStorage) in those environments.
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = (window.navigator as any).standalone === true || 
                       window.matchMedia('(display-mode: standalone)').matches;

  const persistenceType = (isIOS || isStandalone) ? browserLocalPersistence : indexedDBLocalPersistence;

  setPersistence(auth, persistenceType)
    .then(() => {
      console.log(`Firebase Auth persistence configured successfully (${isIOS || isStandalone ? 'LocalStorage' : 'IndexedDB'}).`);
    })
    .catch((err) => {
      console.warn('Configured persistence type failed, falling back to LocalStorage:', err);
      setPersistence(auth, browserLocalPersistence).catch((e) => {
        console.error('Failed to set LocalStorage persistence fallback:', e);
      });
    });
}
