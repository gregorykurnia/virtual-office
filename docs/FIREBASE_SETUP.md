# Firebase client setup

The frontend uses the Firebase modular JavaScript SDK and the default Cloud Firestore database for the registered `virtual-office-77c1d` web app.

## Local configuration

The supplied web app configuration is in the ignored file `frontend/.env.local`. For a new checkout, copy `frontend/.env.example` to `frontend/.env.local` and fill in the values from Firebase Console → Project settings → Your apps. Vite exposes only variables prefixed with `VITE_` to browser code.

The SDK singleton is `frontend/src/lib/firebase.ts`:

- `firebaseApp` is the initialized Firebase app, or `null` when the required web config is absent.
- `getFirestoreDb()` loads and returns the app's default Firestore instance on first use, or returns `null` when Firebase is not configured.
- `isFirebaseConfigured` lets future app startup or service code handle an unconfigured environment explicitly.

Firestore loads on demand so the initial office page does not download database code before it needs data.

The web configuration is public client configuration and will be present in the built frontend. Firebase security must come from Authentication and Firestore Security Rules; do not put service-account credentials or Admin SDK keys in Vite variables. No Firestore reads or writes are enabled yet, and this setup does not change project rules or create a Firestore database.

The initialization follows Firebase's [modular web SDK setup](https://firebase.google.com/docs/web/setup) and [Cloud Firestore web initialization](https://firebase.google.com/docs/firestore/quickstart#initialize_cloud_firestore).
