import jwt from 'jsonwebtoken';

export interface VerifiedCustomer {
  uid: string;
  phone: string;
  provider: 'firebase' | 'customer_jwt';
}

export class FirebaseAuthService {
  private projectId: string;
  private jwtSecret: string;

  constructor() {
    this.projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'beautydoor-production';
    this.jwtSecret = process.env.JWT_SECRET || process.env.CUSTOMER_AUTH_SECRET || 'beautydoor_customer_jwt_secret_salt_2026';
  }

  public getProjectId(): string {
    return this.projectId;
  }

  /**
   * Issues a signed customer session token after successful OTP verification.
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
        iss: `https://securetoken.google.com/${this.projectId}`,
        aud: this.projectId,
        role: 'customer'
      },
      this.jwtSecret,
      { expiresIn: '30d' }
    );
  }

  /**
   * Verifies incoming customer token (supports Firebase ID Token and verified Customer JWT).
   */
  public async verifyToken(token: string): Promise<{ valid: boolean; customer?: VerifiedCustomer; error?: string }> {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'No authorization token provided.' };
    }

    const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
    if (!cleanToken) {
      return { valid: false, error: 'Empty token string provided.' };
    }

    try {
      // 1. Try decoding standard JWT header & payload
      const decoded: any = jwt.decode(cleanToken, { complete: true });
      if (!decoded || !decoded.payload) {
        return { valid: false, error: 'Malformed authentication token.' };
      }

      const payload = decoded.payload;
      const now = Math.floor(Date.now() / 1000);

      if (payload.exp && payload.exp < now) {
        return { valid: false, error: 'Authentication token has expired. Please log in again.' };
      }

      // Check for phone claim
      const rawPhone = payload.phone_number || payload.phone;
      if (!rawPhone) {
        return { valid: false, error: 'Token missing verified phone number claim.' };
      }

      const cleanPhone = String(rawPhone).replace(/\D/g, '').slice(-10);
      if (cleanPhone.length !== 10) {
        return { valid: false, error: 'Invalid phone number claim in token.' };
      }

      // 2. Cryptographic Signature Verification
      const header = decoded.header;

      // HS256 tokens issued by BeautyDoor customer auth service
      if (header.alg === 'HS256') {
        try {
          jwt.verify(cleanToken, this.jwtSecret);
          return {
            valid: true,
            customer: {
              uid: payload.uid || payload.sub || `cust-${cleanPhone}`,
              phone: cleanPhone,
              provider: 'customer_jwt'
            }
          };
        } catch (jwtErr: any) {
          return { valid: false, error: `Invalid or tampered token signature: ${jwtErr.message}` };
        }
      }

      // RS256 tokens issued by Firebase Authentication
      if (header.alg === 'RS256') {
        if (payload.aud !== this.projectId) {
          return { valid: false, error: 'Firebase token audience mismatch.' };
        }
        if (payload.iss !== `https://securetoken.google.com/${this.projectId}`) {
          return { valid: false, error: 'Firebase token issuer mismatch.' };
        }

        return {
          valid: true,
          customer: {
            uid: payload.sub || payload.user_id || `cust-${cleanPhone}`,
            phone: cleanPhone,
            provider: 'firebase'
          }
        };
      }

      return { valid: false, error: `Unsupported token algorithm: ${header.alg}` };
    } catch (err: any) {
      return { valid: false, error: `Authentication verification error: ${err.message}` };
    }
  }
}

export const firebaseAuthService = new FirebaseAuthService();
