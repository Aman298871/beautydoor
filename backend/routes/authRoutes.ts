import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.ts';
import { generateAdminToken, requireAdminAuth, recordAuditLog } from '../middleware/auth.ts';

export const authRouter = Router();

// Admin Login
authRouter.post('/admin/login', (req: Request, res: Response): void => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required.' });
    return;
  }

  const user = db.prepare('SELECT * FROM admin_users WHERE username = ? AND is_active = 1').get(username) as any;
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
  db.prepare('UPDATE admin_users SET last_login = ? WHERE id = ?').run(now, user.id);

  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  };

  const token = generateAdminToken(payload);
  recordAuditLog(user.username, 'LOGIN', 'AUTH', user.id, { ip: req.ip }, req.ip);

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

// Customer OTP Simulation
authRouter.post('/customer/otp/send', (req: Request, res: Response): void => {
  const { phone } = req.body;
  if (!phone || typeof phone !== 'string' || phone.replace(/\D/g, '').length < 10) {
    res.status(400).json({ error: 'A valid 10-digit Indian mobile number is required.' });
    return;
  }
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  res.json({
    success: true,
    message: `OTP sent to +91 ${cleanPhone}.`,
    devOtp: '1234' // Provided for test environments
  });
});

authRouter.post('/customer/otp/verify', (req: Request, res: Response): void => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    res.status(400).json({ error: 'Phone number and 4-digit OTP are required.' });
    return;
  }
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  if (otp === '1234') {
    res.json({
      success: true,
      customerId: `cust-${cleanPhone}`,
      phone: `+91 ${cleanPhone}`
    });
  } else {
    res.status(400).json({ error: 'Invalid OTP code. Please enter 1234 for verification.' });
  }
});
