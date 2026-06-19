import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence, indexedDBLocalPersistence, browserPopupRedirectResolver } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

let persistenceType = undefined;
if (typeof window !== 'undefined') {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = (window.navigator as any).standalone === true || 
                       window.matchMedia('(display-mode: standalone)').matches;

  // iOS and PWA standalone modes have bugs with IndexedDB persistence in WebKit Web.app container.
  // We force browserLocalPersistence (LocalStorage) in those environments.
  persistenceType = (isIOS || isStandalone) ? browserLocalPersistence : [indexedDBLocalPersistence, browserLocalPersistence];
}

export const auth = initializeAuth(app, {
  persistence: persistenceType || browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver
});
