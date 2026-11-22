import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import jwt from 'jsonwebtoken';

export interface VerifiedCustomer {
  uid: string;
  phone: string;
  provider: 'firebase' | 'customer_jwt';
}

export class FirebaseAuthService {
  private projectId: string;
  private jwtSecret: string;
  private isInitialized: boolean = false;

  constructor() {
    this.projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'beautydoor-production';

    // Verify project IDs match between client and server if both are defined
    const clientProjectId = process.env.VITE_FIREBASE_PROJECT_ID;
    const serverProjectId = process.env.FIREBASE_PROJECT_ID;
    if (clientProjectId && serverProjectId && clientProjectId !== serverProjectId) {
      const mismatchMsg = `[FirebaseAuthService:SECURITY] Project ID mismatch: Client (VITE_FIREBASE_PROJECT_ID=${clientProjectId}) does not match Server (FIREBASE_PROJECT_ID=${serverProjectId}).`;
      console.error(mismatchMsg);
      if (process.env.NODE_ENV === 'production') {
        throw new Error(mismatchMsg);
      }
    }

    // Require non-fallback secret in production mode
    const secret = process.env.CUSTOMER_AUTH_SECRET || process.env.JWT_SECRET;
    if (process.env.NODE_ENV === 'production') {
      if (!secret || secret === 'beautydoor_customer_jwt_secret_salt_2026' || secret === 'default_secret' || secret === 'change_this_secret') {
        throw new Error('CRITICAL: JWT_SECRET or CUSTOMER_AUTH_SECRET must be explicitly configured to a secure random value in production mode.');
      }
      this.jwtSecret = secret;
    } else {
      this.jwtSecret = secret || 'beautydoor_customer_jwt_secret_salt_2026';
    }
  }

  public getProjectId(): string {
    return this.projectId;
  }

  /**
   * Initializes Firebase Admin SDK safely.
   * Supports:
   * 1. Service account file path via FIREBASE_SERVICE_ACCOUNT_PATH, FIREBASE_SERVICE_ACCOUNT_KEY, or GOOGLE_APPLICATION_CREDENTIALS
   * 2. Raw JSON string via FIREBASE_SERVICE_ACCOUNT_JSON
   * 3. Discrete env vars: FIREBASE_CLIENT_EMAIL & FIREBASE_PRIVATE_KEY
   * In production mode, fails closed if valid service account credentials are not provided.
   */
  public initFirebaseAdmin(): void {
    if (this.isInitialized || getApps().length > 0) {
      this.isInitialized = true;
      return;
    }

    try {
      // 1. JSON file path (supporting FIREBASE_SERVICE_ACCOUNT_PATH explicitly)
      const credPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
                       process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH ||
                       process.env.GOOGLE_APPLICATION_CREDENTIALS ||
                       (process.env.FIREBASE_SERVICE_ACCOUNT_KEY && fs.existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) ? process.env.FIREBASE_SERVICE_ACCOUNT_KEY : undefined);

      if (credPath && fs.existsSync(credPath)) {
        const fileContent = JSON.parse(fs.readFileSync(credPath, 'utf8'));
        const effectiveProjectId = fileContent.project_id || this.projectId;
        initializeApp({
          credential: cert(fileContent),
          projectId: effectiveProjectId
        });
        this.projectId = effectiveProjectId;
        this.isInitialized = true;
        console.log(`[FirebaseAuthService] Firebase Admin initialized from service account file: ${credPath}`);
        return;
      }

      // 2. Direct JSON string in environment (supporting FIREBASE_SERVICE_ACCOUNT_JSON and fallback string FIREBASE_SERVICE_ACCOUNT_KEY)
      const jsonRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
                      (process.env.FIREBASE_SERVICE_ACCOUNT_KEY && process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim().startsWith('{') ? process.env.FIREBASE_SERVICE_ACCOUNT_KEY : undefined);

      if (jsonRaw) {
        const parsed = JSON.parse(jsonRaw);
        const effectiveProjectId = parsed.project_id || this.projectId;
        initializeApp({
          credential: cert(parsed),
          projectId: effectiveProjectId
        });
        this.projectId = effectiveProjectId;
        this.isInitialized = true;
        console.log('[FirebaseAuthService] Firebase Admin initialized from service account JSON string.');
        return;
      }

      // 3. Discrete credentials in environment
      if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
        initializeApp({
          credential: cert({
            projectId: this.projectId,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey
          }),
          projectId: this.projectId
        });
        this.isInitialized = true;
        console.log('[FirebaseAuthService] Firebase Admin initialized from discrete environment credentials.');
        return;
      }

      // 4. In production, fail closed: do not initialize unverified default app
      if (process.env.NODE_ENV === 'production') {
        this.isInitialized = false;
        console.warn('[FirebaseAuthService:SECURITY] No valid service account credentials found (FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON). Refusing unverified fallback in production.');
        return;
      }

      // 5. Development/Test mode fallback
      initializeApp({
        projectId: this.projectId
      });
      this.isInitialized = true;
      console.log(`[FirebaseAuthService] Firebase Admin initialized with local development projectId: ${this.projectId}`);
    } catch (err: any) {
      this.isInitialized = false;
      console.warn('[FirebaseAuthService] Firebase Admin initialization error:', err.message);
    }
  }

  /**
   * Cryptographically verifies a Firebase ID Token using the Firebase Admin SDK.
   * Validates RS256 signature against Google's live public keys.
   */
  public async verifyFirebaseIdToken(
    idToken: string
  ): Promise<{ valid: boolean; uid?: string; phone?: string; error?: string }> {
    if (!idToken || typeof idToken !== 'string') {
      return { valid: false, error: 'Empty or invalid token format' };
    }

    if (!this.isInitialized) {
      this.initFirebaseAdmin();
    }

    if (!this.isInitialized) {
      return {
        valid: false,
        error: 'Firebase Admin authentication is not configured. Configure FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON.'
      };
    }

    const cleanToken = idToken.startsWith('Bearer ') ? idToken.slice(7).trim() : idToken.trim();
    if (!cleanToken) {
      return { valid: false, error: 'Empty Firebase ID token provided.' };
    }

    try {
      // Verifies RS256 cryptographic signature against Google's public key endpoint
      const decoded = await getAuth().verifyIdToken(cleanToken, true);

      if (!decoded.phone_number) {
        return {
          valid: false,
          error: 'Firebase ID token does not contain a verified phone number claim. Phone authentication is required.'
        };
      }

      const cleanPhone = decoded.phone_number.replace(/\D/g, '').slice(-10);
      return {
        valid: true,
        uid: decoded.uid,
        phone: cleanPhone
      };
    } catch (err: any) {
      // In isolated local test/dev environments without outbound internet or live Google service account:
      if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEV_MOCK_AUTH === 'true') {
        try {
          const decoded: any = jwt.decode(cleanToken);
          if (decoded && (decoded.phone_number || decoded.phone)) {
            const cleanPhone = String(decoded.phone_number || decoded.phone).replace(/\D/g, '').slice(-10);
            return {
              valid: true,
              uid: decoded.uid || decoded.sub || `cust-${cleanPhone}`,
              phone: cleanPhone
            };
          }
        } catch {}
      }

      console.warn('[FirebaseAuthService] Cryptographic ID Token verification failed:', err.message);
      return { valid: false, error: `Invalid or unverified Firebase ID token: ${err.message}` };
    }
  }

  /**
   * Issues a signed BeautyDoor customer session token after successful verification.
   */
  public generateCustomerToken(phone: string, uid?: string): string {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const customerUid = uid || `cust-${cleanPhone}`;
    return jwt.sign(
      {
        uid: customerUid,
        sub: customerUid,
        phone_number: `+91${cleanPhone}`,
        phone: cleanPhone,
        iss: 'beautydoor-auth-service',
        aud: 'beautydoor-storefront',
        role: 'customer'
      },
      this.jwtSecret,
      { expiresIn: '30d' }
    );
  }

  /**
   * Verifies incoming customer authorization token on protected customer routes.
   * Supports BeautyDoor session JWT (HS256) and raw Firebase ID tokens (RS256).
   */
  public async verifyToken(
    token: string
  ): Promise<{ valid: boolean; customer?: VerifiedCustomer; error?: string }> {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'No authorization token provided.' };
    }

    const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
    if (!cleanToken) {
      return { valid: false, error: 'Empty token string provided.' };
    }

    try {
      const decoded: any = jwt.decode(cleanToken, { complete: true });
      if (!decoded || !decoded.payload) {
        return { valid: false, error: 'Malformed authentication token.' };
      }

      const header = decoded.header;
      const payload = decoded.payload;

      // 1. HS256: Session token issued by BeautyDoor customer auth service
      if (header.alg === 'HS256') {
        try {
          const verified: any = jwt.verify(cleanToken, this.jwtSecret);
          const rawPhone = verified.phone_number || verified.phone;
          const cleanPhone = String(rawPhone).replace(/\D/g, '').slice(-10);

          return {
            valid: true,
            customer: {
              uid: verified.uid || verified.sub || `cust-${cleanPhone}`,
              phone: cleanPhone,
              provider: 'customer_jwt'
            }
          };
        } catch (jwtErr: any) {
          return { valid: false, error: `Invalid or tampered token signature: ${jwtErr.message}` };
        }
      }

      // 2. RS256: Raw Firebase ID token - verify via Firebase Admin SDK
      if (header.alg === 'RS256') {
        const fbRes = await this.verifyFirebaseIdToken(cleanToken);
        if (fbRes.valid && fbRes.uid && fbRes.phone) {
          return {
            valid: true,
            customer: {
              uid: fbRes.uid,
              phone: fbRes.phone,
              provider: 'firebase'
            }
          };
        }
        return { valid: false, error: fbRes.error || 'Firebase ID token verification failed.' };
      }

      return { valid: false, error: `Unsupported token algorithm: ${header.alg}` };
    } catch (err: any) {
      return { valid: false, error: `Authentication verification error: ${err.message}` };
    }
  }
}

export const firebaseAuthService = new FirebaseAuthService();
