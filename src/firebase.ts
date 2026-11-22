import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  Auth,
  UserCredential
} from 'firebase/auth';

/**
 * BeautyDoor Production Firebase Configuration
 * Reads public client configuration from Vite environment variables (VITE_FIREBASE_*).
 * Keep sensitive service account keys exclusively on the backend.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'beautydoor-production',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null;
  if (!isFirebaseConfigured()) return null;

  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth | null {
  if (typeof window === 'undefined') return null;
  const currentApp = getFirebaseApp();
  if (!currentApp) return null;

  if (!auth) {
    auth = getAuth(currentApp);
  }
  return auth;
}

/**
 * Creates and attaches a Firebase RecaptchaVerifier to a DOM container.
 * Supports invisible or normal captcha as configured.
 */
export function setupRecaptcha(
  containerId: string | HTMLElement,
  size: 'invisible' | 'normal' = 'invisible',
  onSolved?: () => void,
  onExpired?: () => void
): RecaptchaVerifier | null {
  const currentAuth = getFirebaseAuth();
  if (!currentAuth) return null;

  return new RecaptchaVerifier(currentAuth, containerId, {
    size,
    callback: () => {
      if (onSolved) onSolved();
    },
    'expired-callback': () => {
      if (onExpired) onExpired();
    }
  });
}

/**
 * Initiates Firebase Phone Authentication:
 * Sends an SMS containing a 6-digit verification code to the customer's phone number.
 */
export async function sendFirebasePhoneOtp(
  phone: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  const currentAuth = getFirebaseAuth();
  if (!currentAuth) {
    throw new Error('Firebase Authentication is not configured on this client. Please check VITE_FIREBASE_* environment settings.');
  }

  const cleanDigits = phone.replace(/\D/g, '').slice(-10);
  if (!/^[6-9]\d{9}$/.test(cleanDigits)) {
    throw new Error('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
  }

  const e164Phone = `+91${cleanDigits}`;
  return await signInWithPhoneNumber(currentAuth, e164Phone, verifier);
}

/**
 * Confirms the 6-digit OTP code entered by the customer and returns the signed Firebase ID Token.
 */
export async function confirmFirebasePhoneOtp(
  confirmationResult: ConfirmationResult,
  otpCode: string
): Promise<{ userCredential: UserCredential; idToken: string }> {
  const cleanCode = otpCode.trim();
  if (!/^\d{6}$/.test(cleanCode)) {
    throw new Error('Please enter a valid 6-digit numerical verification code.');
  }

  const userCredential = await confirmationResult.confirm(cleanCode);
  const idToken = await userCredential.user.getIdToken(true);
  return { userCredential, idToken };
}
