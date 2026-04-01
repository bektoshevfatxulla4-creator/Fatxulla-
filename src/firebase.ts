import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, onSnapshot, Timestamp, addDoc, deleteDoc, getDocFromServer, initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
// Use initializeFirestore with experimentalForceLongPolling for better connectivity in restricted environments
const firestoreSettings = {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true,
};

const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';

export const db = initializeFirestore(app, firestoreSettings, databaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Auth Helpers
export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

// Firestore Error Handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection
async function testConnection() {
  try {
    // Try to reach the backend
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection successful.");
  } catch (error: any) {
    console.warn("Firestore connection test warning:", error.message);
    if(error.message?.includes('the client is offline') || error.message?.includes('unavailable')) {
      console.error("CRITICAL: Could not connect to Firestore. Please check your Firebase configuration and network.");
    }
  }
}
testConnection();

export type { User };
export { onAuthStateChanged, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, onSnapshot, Timestamp, addDoc, deleteDoc };
