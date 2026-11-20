import { Request, Response, NextFunction } from 'express';
import { firebaseAuthService, VerifiedCustomer } from '../services/firebaseAuthService.ts';

declare global {
  namespace Express {
    interface Request {
      customer?: VerifiedCustomer;
    }
  }
}

// Rate limiting cache for tracking endpoints (max 30 requests per minute per IP/Phone)
const trackingRateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit: number = 30, windowMs: number = 60000): boolean {
  const now = Date.now();
  const entry = trackingRateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    trackingRateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) {
    return false;
  }
  entry.count += 1;
  return true;
}

export async function requireCustomerAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization || (req.headers['x-firebase-token'] as string);
  if (!authHeader) {
    res.status(401).json({
      error: 'Authentication required. Please sign in with OTP to access your bookings.',
      code: 'AUTH_REQUIRED'
    });
    return;
  }

  const result = await firebaseAuthService.verifyToken(authHeader);
  if (!result.valid || !result.customer) {
    res.status(401).json({
      error: result.error || 'Invalid or expired authentication token. Please sign in again.',
      code: 'INVALID_TOKEN'
    });
    return;
  }

  const customerPhone = result.customer.phone;
  req.customer = result.customer;

  // Rate Limiting Check
  const rateLimitKey = `${customerPhone}:${req.ip || 'ip'}`;
  if (!checkRateLimit(rateLimitKey, 30, 60000)) {
    res.status(429).json({
      error: 'Too many booking tracking requests. Please slow down.',
      code: 'RATE_LIMIT_EXCEEDED'
    });
    return;
  }

  // Cross-Customer Protection:
  // If the query or body contains a phone number, verify it strictly matches the authenticated phone!
  const targetPhone = req.query.phone || req.body?.phone || req.params?.phone;
  if (targetPhone && typeof targetPhone === 'string') {
    const cleanTarget = targetPhone.replace(/\D/g, '').slice(-10);
    if (cleanTarget && cleanTarget !== customerPhone) {
      res.status(403).json({
        error: 'Access denied: You cannot view or modify appointments belonging to another mobile number.',
        code: 'FORBIDDEN_PHONE_MISMATCH'
      });
      return;
    }
  }

  next();
}
