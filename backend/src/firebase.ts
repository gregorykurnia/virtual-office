import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import type { BackendConfig } from "./config.js";

const APP_NAME = "investment-office-api";

export function createFirebaseServices(config: BackendConfig) {
  const existing = getApps().find((app) => app.name === APP_NAME);
  const app = existing ?? initializeApp({
    credential: applicationDefault(),
    projectId: config.firebaseProjectId
  }, APP_NAME);

  const firestore = getFirestore(app);
  firestore.settings({ ignoreUndefinedProperties: true });

  return {
    app,
    auth: getAuth(app),
    firestore
  };
}
