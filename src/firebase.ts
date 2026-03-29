import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, limit, getDocFromServer, runTransaction, writeBatch
} from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// ── App Check (prevents unauthorised API access) ──
// Set VITE_RECAPTCHA_SITE_KEY in .env.local for production.
// For development, set a debug token: window.FIREBASE_APPCHECK_DEBUG_TOKEN = true
if (typeof window !== 'undefined') {
  try {
    const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (recaptchaKey) {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaKey),
        isTokenAutoRefreshEnabled: true,
      });
    } else {
      // Development: enable debug mode via environment variable
      // Add VITE_APP_CHECK_DEBUG=true to .env.local
      if (import.meta.env.VITE_APP_CHECK_DEBUG === 'true') {
        (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      }
    }
  } catch (e) {
    console.warn('App Check init skipped:', e);
  }
}

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  userId?: string;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    userId: auth.currentUser?.uid,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on init
async function testConnection() {
  try {
    await getDocFromServer(doc(db, '_health', 'check'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.error('Firebase: Client appears to be offline. Check your connection.');
    }
    // Ignore permission errors on health check — expected for unauthenticated users
  }
}
testConnection();

export {
  collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, limit, runTransaction, writeBatch,
  signInWithPopup, signOut, onAuthStateChanged,
};
