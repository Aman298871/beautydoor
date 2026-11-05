import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.ts';

// In production, JWT_SECRET must be explicitly set via environment variables.
const isProd = process.env.NODE_ENV === 'production';
const envSecret = process.env.JWT_SECRET;

if (isProd && !envSecret) {
  throw new Error('CRITICAL: JWT_SECRET environment variable is missing in production mode. Refusing startup for security.');
}

export const JWT_SECRET = envSecret || 'beautydoor-dev-local-secret-key-32chars!';

export interface AdminPayload {
  id: string;
  username: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      adminUser?: AdminPayload;
    }
  }
}

export function generateAdminToken(payload: AdminPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Access denied: Authentication required for BeautyDoor Business Control API.'
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminPayload;
    req.adminUser = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      error: 'Invalid or expired administrative session. Please authenticate again.'
    });
  }
}

export async function recordAuditLog(
  username: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: any,
  ip?: string
): Promise<void> {
  try {
    const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await db.execute(`
      INSERT INTO audit_logs (id, admin_username, action, resource_type, resource_id, details_json, timestamp, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      logId,
      username,
      action,
      resourceType,
      resourceId || null,
      details ? JSON.stringify(details) : null,
      new Date().toISOString(),
      ip || '127.0.0.1'
    ]);
  } catch (e) {
    console.error('Audit logging failed:', e);
  }
}
