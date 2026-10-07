import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  browserSessionPersistence,
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User
} from "firebase/auth";
import { firebaseApp, isFirebaseConfigured } from "../lib/firebase";
import LiveApplication from "./LiveApplication";

type AccessState =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "checking"; email: string | null }
  | { kind: "owner"; email: string | null; displayName: string | null }
  | { kind: "not-owner"; email: string | null }
  | { kind: "unavailable"; email: string | null };

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";
let configuredAuth: ReturnType<typeof getAuth> | null | undefined;

function getOwnerAuth() {
  if (configuredAuth !== undefined) return configuredAuth;
  configuredAuth = firebaseApp ? getAuth(firebaseApp) : null;
  const emulatorHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST?.trim();
  if (configuredAuth && emulatorHost) {
    connectAuthEmulator(configuredAuth, `http://${emulatorHost}`, { disableWarnings: true });
  }
  return configuredAuth;
}

async function verifyOwnerSession(user: User): Promise<{ email: string | null; displayName: string | null }> {
  let token: string;
  try {
    token = await user.getIdToken();
  } catch {
    throw new Error("session_expired");
  }
  const apiUrl = new URL(`${apiBaseUrl.replace(/\/$/, "")}/auth/session`, window.location.origin);
  if (apiUrl.origin !== window.location.origin) throw new Error("api_origin_invalid");
  const response = await fetch(apiUrl.pathname, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "omit",
    cache: "no-store"
  });

  if (response.status === 403) throw new Error("owner_access_required");
  if (response.status === 401) throw new Error("session_expired");
  if (!response.ok) throw new Error("session_verification_failed");

  const payload: unknown = await response.json();
  if (typeof payload !== "object" || payload === null || !("data" in payload)) {
    throw new Error("session_verification_failed");
  }
  const data = payload.data;
  if (typeof data !== "object" || data === null || !("uid" in data) || data.uid !== user.uid) {
    throw new Error("session_verification_failed");
  }

  return {
    email: "email" in data && typeof data.email === "string" ? data.email : user.email,
    displayName: "displayName" in data && typeof data.displayName === "string" ? data.displayName : user.displayName
  };
}

export default function OwnerAccessApp() {
  const auth = useMemo(getOwnerAuth, []);
  const [state, setState] = useState<AccessState>({ kind: "loading" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const verificationAttempt = useRef(0);

  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setState({ kind: "signed-out" });
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let isActive = true;
    void setPersistence(auth, browserSessionPersistence).then(() => {
      if (!isActive) return;
      unsubscribe = onAuthStateChanged(auth, (user) => {
        const attempt = ++verificationAttempt.current;
        if (!user) {
          setState({ kind: "signed-out" });
          return;
        }

        setState({ kind: "checking", email: user.email });
        void verifyOwnerSession(user).then((session) => {
          if (!isActive || attempt !== verificationAttempt.current) return;
          setState({ kind: "owner", ...session });
          setFormError(null);
        }).catch((error: unknown) => {
          if (!isActive || attempt !== verificationAttempt.current) return;
          if (error instanceof Error && error.message === "owner_access_required") {
            setState({ kind: "not-owner", email: user.email });
            return;
          }
          if (error instanceof Error && error.message === "session_expired") {
            setNotice("Your sign-in expired. Sign in again to continue.");
            if (auth) void signOut(auth);
            return;
          }
          setState({ kind: "unavailable", email: user.email });
        });
      });
    }).catch(() => {
      if (isActive) setState({ kind: "signed-out" });
      setFormError("Secure sign-in could not be initialized. Check the Firebase web configuration.");
    });

    return () => {
      isActive = false;
      verificationAttempt.current += 1;
      unsubscribe?.();
    };
  }, [auth]);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!auth) return;
    setSubmitting(true);
    setFormError(null);
    setNotice(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword("");
    } catch {
      setFormError("Sign-in failed. Check your email and password, then try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    if (!auth) return;
    await signOut(auth);
    setNotice("You have been signed out.");
    setPassword("");
  }

  if (state.kind === "owner" && auth?.currentUser) return <LiveApplication user={auth.currentUser} />;

  return (
    <div className="app-shell owner-access-shell">
      <header className="topbar owner-access-topbar">
        <div className="topbar__main">
          <a className="brand" href="/" aria-label="Investment Office home">
            <span className="brand-mark" aria-hidden="true">IO</span>
            <span>Investment Office</span>
          </a>
        </div>
        <span className="owner-access-label">Private owner sign-in</span>
      </header>

      <main className="owner-access-main">
        <section className="owner-access-card" aria-labelledby="owner-access-title">
          <p className="eyebrow">Private workspace</p>
          {state.kind === "loading" || state.kind === "checking" ? (
            <div className="owner-access-state" role="status" aria-live="polite">
              <span className="owner-access-spinner" aria-hidden="true" />
              <h1 id="owner-access-title">{state.kind === "checking" ? "Verifying owner access" : "Preparing sign-in"}</h1>
              <p>{state.kind === "checking" ? "Checking this account with the private API." : "Checking Firebase Auth and private API settings."}</p>
            </div>
          ) : (
            <>
              <h1 id="owner-access-title">Sign in to your office</h1>
              <p className="owner-access-intro">Use the owner account configured for this private workspace.</p>
              {state.kind === "not-owner" ? (
                <p className="owner-access-message owner-access-message--error" role="alert">
                  This account is not on the owner allowlist. Sign out and use the configured owner account.
                  <button className="text-button" type="button" onClick={() => void handleSignOut()}>Sign out</button>
                </p>
              ) : null}
              {state.kind === "unavailable" ? (
                <p className="owner-access-message owner-access-message--error" role="alert">
                  The private API could not verify this session. Check the connection and try again.
                </p>
              ) : null}
              {notice ? <p className="owner-access-message" role="status">{notice}</p> : null}
              {formError ? <p className="owner-access-message owner-access-message--error" role="alert">{formError}</p> : null}

              {!isFirebaseConfigured ? (
                <p className="owner-access-message owner-access-message--error" role="alert">
                  Firebase Auth is not configured for this frontend. Add the Firebase web settings before signing in.
                </p>
              ) : (
                <form className="owner-access-form" onSubmit={(event) => void handleSignIn(event)}>
                  <label htmlFor="owner-email">Email</label>
                  <input
                    id="owner-email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    maxLength={254}
                  />
                  <label htmlFor="owner-password">Password</label>
                  <input
                    id="owner-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    maxLength={256}
                  />
                  <button className="primary-button owner-access-submit" type="submit" disabled={submitting}>
                    {submitting ? "Signing in…" : "Sign in"}
                  </button>
                  <p className="owner-access-note">Account creation is disabled in this interface. Only the configured owner can access private data.</p>
                </form>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
