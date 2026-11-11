import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db/database.ts';
import { generateAdminToken, requireAdminAuth, recordAuditLog } from '../middleware/auth.ts';
import { smsService } from '../services/smsService.ts';

export const authRouter = Router();

// Secure in-memory OTP storage with hashing, cooldown, attempt limits, and expiration
interface SecureOtpEntry {
  hashedCode: string;
  expiresAt: number;
  cooldownUntil: number;
  attemptsLeft: number;
  createdAt: number;
}

interface RateLimitRecord {
  requestTimestamps: number[];
}

const otpStore = new Map<string, SecureOtpEntry>();
const rateLimitStore = new Map<string, RateLimitRecord>();

// Server-side salt for OTP hash (generated per process or from env)
const OTP_HASH_SALT = process.env.OTP_SECRET_SALT || crypto.randomBytes(16).toString('hex');

function hashOtp(phone: string, otp: string): string {
  return crypto.createHash('sha256').update(`${phone}:${otp}:${OTP_HASH_SALT}`).digest('hex');
}

// Clean up expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [phone, entry] of otpStore.entries()) {
    if (now > entry.expiresAt) {
      otpStore.delete(phone);
    }
  }
  for (const [phone, record] of rateLimitStore.entries()) {
    record.requestTimestamps = record.requestTimestamps.filter(t => now - t < 3600000);
    if (record.requestTimestamps.length === 0) {
      rateLimitStore.delete(phone);
    }
  }
}, 300000); // Clean every 5 mins

// Admin Login
authRouter.post('/admin/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required.' });
    return;
  }

  const user = await db.queryRow('SELECT * FROM admin_users WHERE username = ? AND is_active = 1', [username]);
  if (!user) {
    res.status(401).json({ error: 'Invalid administrative credentials.' });
    return;
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
  if (!isPasswordValid) {
    res.status(401).json({ error: 'Invalid administrative credentials.' });
    return;
  }

  // Update last login
  const now = new Date().toISOString();
  await db.execute('UPDATE admin_users SET last_login = ? WHERE id = ?', [now, user.id]);

  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  };

  const token = generateAdminToken(payload);
  await recordAuditLog(user.username, 'LOGIN', 'AUTH', user.id, { ip: req.ip }, req.ip);

  res.json({
    success: true,
    token,
    user: payload
  });
});

// Admin Self Profile
authRouter.get('/admin/me', requireAdminAuth, (req: Request, res: Response): void => {
  res.json({ user: req.adminUser });
});

// Customer OTP Send
authRouter.post('/customer/otp/send', async (req: Request, res: Response): Promise<void> => {
  const { phone } = req.body;
  if (!phone || typeof phone !== 'string') {
    res.status(400).json({ error: 'A valid 10-digit Indian mobile number is required.' });
    return;
  }

  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  if (!smsService.isValidIndianMobile(cleanPhone)) {
    res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.' });
    return;
  }

  const now = Date.now();

  // 1. Rate Limiting: Max 5 OTP dispatches per hour per mobile number
  let rateRecord = rateLimitStore.get(cleanPhone);
  if (!rateRecord) {
    rateRecord = { requestTimestamps: [] };
    rateLimitStore.set(cleanPhone, rateRecord);
  }
  rateRecord.requestTimestamps = rateRecord.requestTimestamps.filter(t => now - t < 3600000);
  if (rateRecord.requestTimestamps.length >= 5) {
    res.status(429).json({
      error: 'Hourly OTP limit reached for this number. Please try again after some time or contact customer support.'
    });
    return;
  }

  // 2. Resend Cooldown Check: 60 seconds minimum interval
  const existingOtp = otpStore.get(cleanPhone);
  if (existingOtp && now < existingOtp.cooldownUntil) {
    const remainingSeconds = Math.ceil((existingOtp.cooldownUntil - now) / 1000);
    res.status(429).json({
      error: `Please wait ${remainingSeconds} seconds before requesting a new OTP.`,
      cooldownSeconds: remainingSeconds
    });
    return;
  }

  // 3. Cryptographically Secure 6-digit OTP Generation (inclusive bounds: 100000 to 999999)
  const generatedOtp = crypto.randomInt(100000, 1000000).toString();

  // 4. Dispatch via Cellular SMS Provider directly to customer's mobile number
  const smsResult = await smsService.sendOtp(cleanPhone, generatedOtp);

  // If live SMS provider credentials are missing or dispatch fails in production, report as BLOCKED
  if (!smsResult.success) {
    res.status(503).json({
      success: false,
      blocked: true,
      error: smsResult.error || 'Cellular SMS delivery is currently unavailable. Please configure live provider credentials or contact customer support.',
      provider: smsResult.provider
    });
    return;
  }

  // 5. Store Secure Hashed Entry with Expiration & Attempt Counter
  otpStore.set(cleanPhone, {
    hashedCode: hashOtp(cleanPhone, generatedOtp),
    expiresAt: now + 10 * 60 * 1000, // 10 minutes expiry
    cooldownUntil: now + 60 * 1000,   // 60 seconds resend cooldown
    attemptsLeft: 5,                  // Maximum 5 incorrect attempts before invalidation
    createdAt: now
  });

  // Record rate limit timestamp
  rateRecord.requestTimestamps.push(now);

  const isDevOrTest = process.env.NODE_ENV !== 'production';
  const responsePayload: any = {
    success: true,
    message: smsResult.telemetryMessage || `OTP verification code dispatched to +91 ${cleanPhone}.`,
    cooldownSeconds: 60,
    provider: smsResult.provider
  };

  // Only provide devOtp if explicitly in automated test / dev environment and NOT in production
  if (isDevOrTest && process.env.ENABLE_DEV_OTP === 'true') {
    responsePayload.devOtp = generatedOtp;
  }

  res.json(responsePayload);
});

// Customer OTP Verify
authRouter.post('/customer/otp/verify', (req: Request, res: Response): void => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    res.status(400).json({ error: 'Phone number and 6-digit verification code are required.' });
    return;
  }

  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const cleanOtp = String(otp).trim();

  if (!/^\d{6}$/.test(cleanOtp)) {
    res.status(400).json({ error: 'Please enter a valid 6-digit numerical OTP code.' });
    return;
  }

  const storedEntry = otpStore.get(cleanPhone);
  const now = Date.now();

  if (!storedEntry || now > storedEntry.expiresAt) {
    if (storedEntry) otpStore.delete(cleanPhone);
    res.status(400).json({
      error: 'OTP code has expired or was not requested. Please tap "Resend OTP".'
    });
    return;
  }

  // Check attempts limit
  if (storedEntry.attemptsLeft <= 0) {
    otpStore.delete(cleanPhone);
    res.status(403).json({
      error: 'Maximum verification attempts exceeded. For your security, this OTP has been cancelled. Please request a new code.'
    });
    return;
  }

  // Verify SHA-256 Hash
  const incomingHash = hashOtp(cleanPhone, cleanOtp);

  if (incomingHash === storedEntry.hashedCode) {
    // Invalidate immediately to prevent replay attacks
    otpStore.delete(cleanPhone);

    res.json({
      success: true,
      customerId: `cust-${cleanPhone}`,
      phone: `+91 ${cleanPhone}`,
      message: 'Mobile number verified successfully.'
    });
  } else {
    storedEntry.attemptsLeft -= 1;
    if (storedEntry.attemptsLeft <= 0) {
      otpStore.delete(cleanPhone);
      res.status(403).json({
        error: 'Too many incorrect attempts. This OTP has been invalidated. Please request a new code.'
      });
    } else {
      res.status(400).json({
        error: `Incorrect OTP code. You have ${storedEntry.attemptsLeft} attempt${storedEntry.attemptsLeft === 1 ? '' : 's'} remaining.`,
        attemptsLeft: storedEntry.attemptsLeft
      });
    }
  }
});
