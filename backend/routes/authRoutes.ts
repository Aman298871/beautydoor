import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db/database.ts';
import { generateAdminToken, requireAdminAuth, recordAuditLog } from '../middleware/auth.ts';

export const authRouter = Router();

// In-memory OTP storage for customer authentication with expiration
interface OtpEntry {
  code: string;
  expiresAt: number;
}
const otpStore = new Map<string, OtpEntry>();

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
authRouter.post('/customer/otp/send', (req: Request, res: Response): void => {
  const { phone } = req.body;
  if (!phone || typeof phone !== 'string' || phone.replace(/\D/g, '').length < 10) {
    res.status(400).json({ error: 'A valid 10-digit Indian mobile number is required.' });
    return;
  }
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);

  // Generate 4-digit cryptographically secure OTP
  const isDevOrTest = process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEV_OTP === 'true';
  const generatedOtp = isDevOrTest ? '1234' : crypto.randomInt(1000, 9999).toString();

  // Store OTP with 10-minute expiry
  otpStore.set(cleanPhone, {
    code: generatedOtp,
    expiresAt: Date.now() + 10 * 60 * 1000
  });

  const hasSmsProvider = !!process.env.SMS_PROVIDER_API_KEY;
  const responsePayload: any = {
    success: true,
    message: hasSmsProvider
      ? `OTP sent via SMS to +91 ${cleanPhone}.`
      : isDevOrTest
        ? `Development OTP generated for +91 ${cleanPhone}.`
        : `OTP verification code issued for +91 ${cleanPhone}. (SMS gateway integration required for cellular dispatch)`
  };

  // Only include devOtp in response if explicitly in dev/test mode
  if (isDevOrTest) {
    responsePayload.devOtp = generatedOtp;
  }

  res.json(responsePayload);
});

// Customer OTP Verify
authRouter.post('/customer/otp/verify', (req: Request, res: Response): void => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    res.status(400).json({ error: 'Phone number and 4-digit OTP are required.' });
    return;
  }
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const storedEntry = otpStore.get(cleanPhone);

  const isDevOrTest = process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEV_OTP === 'true';
  const isFixedOtpValid = isDevOrTest && otp === '1234';
  const isStoredOtpValid = storedEntry && storedEntry.code === String(otp) && Date.now() <= storedEntry.expiresAt;

  if (isFixedOtpValid || isStoredOtpValid) {
    otpStore.delete(cleanPhone);
    res.json({
      success: true,
      customerId: `cust-${cleanPhone}`,
      phone: `+91 ${cleanPhone}`
    });
  } else {
    res.status(400).json({
      error: 'Invalid or expired OTP code. Please request a new OTP.'
    });
  }
});
