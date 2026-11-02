import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'beautydoor-super-secret-production-key-2026';

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

export function recordAuditLog(
  username: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: any,
  ip?: string
) {
  try {
    const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO audit_logs (id, admin_username, action, resource_type, resource_id, details_json, timestamp, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      logId,
      username,
      action,
      resourceType,
      resourceId || null,
      details ? JSON.stringify(details) : null,
      new Date().toISOString(),
      ip || '127.0.0.1'
    );
  } catch (e) {
    console.error('Audit logging failed:', e);
  }
}
