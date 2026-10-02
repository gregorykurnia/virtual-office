import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import type { Firestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

/** Firebase web config is public client configuration; access is controlled by Firebase Auth and Rules. */
export const firebaseApp = isFirebaseConfigured
  ? getApps().some((app) => app.name === "[DEFAULT]")
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

let firestorePromise: Promise<Firestore> | undefined;

/**
 * Loads the default Cloud Firestore client the first time an app data adapter
 * needs it. Returns null when this environment has no Firebase web config.
 */
export function getFirestoreDb(): Promise<Firestore> | null {
  if (!firebaseApp) return null;

  firestorePromise ??= import("firebase/firestore").then(({ getFirestore }) => getFirestore(firebaseApp));
  return firestorePromise;
}
