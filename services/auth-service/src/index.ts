import { Router, Request, Response } from 'express';
import {
  User,
  generateToken,
  requireAuth,
  requireRole,
  AuthRequest,
  otpCache,
  pendingRegCache,
  otpAttemptCache,
} from '@wow/shared';
import nodemailer from 'nodemailer';

const router = Router();

// ── SMTP Transporter ──────────────────────────────────────────────────────────

let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE !== 'false',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
      tls: { rejectUnauthorized: true },
      connectionTimeout: 3000,
      greetingTimeout: 3000,
      socketTimeout: 3000,
      family: 4,
    } as any);
  }
  return transporter;
}

async function sendOtpEmail(email: string, otp: string) {
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'WOW Laundry'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@wow.com'}>`,
    to: email,
    subject: 'WOW Laundry Verification Code',
    text: `Your verification code is ${otp}. It is valid for 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #0D8DE3; text-align: center;">WOW Laundry Verification</h2>
        <p>Hello,</p>
        <p>Your one-time verification code is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; text-align: center; margin: 30px 0; color: #0D8DE3;">${otp}</div>
        <p>This code is valid for 5 minutes. Please do not share this code with anyone.</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #999; text-align: center;">WOW Laundry App &bull; Premium Laundry Services</p>
      </div>
    `,
  };

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[SMTP Config Missing] Fallback OTP for ${email}: ${otp}`);
    return false;
  }

  try {
    await getTransporter().sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Failed to send OTP email to ${email}:`, error);
    return false;
  }
}

// ── OTP Brute-Force Constants ─────────────────────────────────────────────────

const OTP_TTL_MS = 5 * 60 * 1000;       // 5 minutes OTP validity
const OTP_MAX_ATTEMPTS = 5;              // lock after 5 wrong guesses
const OTP_LOCK_TTL_MS = 15 * 60 * 1000; // 15 minute lockout window

// ── Staff roles that bypass OTP entirely ─────────────────────────────────────
// Any user account with one of these roles gets a direct JWT — no email OTP needed.
// This covers SuperAdmin accounts, ShopAdmin accounts, and Delivery staff
// created by an admin via the portal.
const STAFF_ROLES = ['SuperAdmin', 'ShopAdmin', 'Delivery'] as const;

// ── 1. Send OTP (Login Flow) ──────────────────────────────────────────────────
router.post('/send-otp', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || email.trim().length < 3) {
    return res.status(400).json({ error: 'Valid email address is required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  
  // Look up user by normalized email OR domain alias (@wowlaundry.com <-> @wow.com)
  const aliasEmail = normalizedEmail.includes('@wowlaundry.com')
    ? normalizedEmail.replace('@wowlaundry.com', '@wow.com')
    : normalizedEmail.includes('@wow.com')
      ? normalizedEmail.replace('@wow.com', '@wowlaundry.com')
      : null;

  const user = await User.findOne({
    $or: [
      { email: normalizedEmail },
      ...(aliasEmail ? [{ email: aliasEmail }] : [])
    ]
  }).lean() as any;

  // ── Staff Direct Login ────────────────────────────────────────────────────
  // SuperAdmin / ShopAdmin / Delivery accounts created by admins skip OTP.
  // They authenticate immediately with a token — no email OTP flow needed.
  const isStaffRole = user && STAFF_ROLES.includes(user.role);
  if (isStaffRole) {
    const token = generateToken(user);
    return res.json({
      message: 'Staff authenticated directly (No OTP required)',
      directLogin: true,
      user,
      token,
    });
  }

  // Generate 6-digit OTP (more secure than 4-digit)
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  // Store in TTLCache — auto-expires after 5 min, swept every 10 min
  otpCache.set(normalizedEmail, { otp, expiresAt: Date.now() + OTP_TTL_MS }, OTP_TTL_MS);
  // Reset attempt counter when a fresh OTP is sent
  otpAttemptCache.delete(normalizedEmail);

  await sendOtpEmail(normalizedEmail, otp);

  res.json({ message: 'OTP sent successfully to your email' });
});

// ── 2. Register User (Initiate Registration) ──────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  const { name, phone, email } = req.body;
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Full name is required (minimum 2 characters)' });
  }
  if (!phone || phone.trim().length !== 10) {
    return res.status(400).json({ error: 'Valid 10-digit mobile number is required' });
  }
  if (!email || email.trim().length < 3) {
    return res.status(400).json({ error: 'Valid email address is required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone }]
    }).select('email phone').lean() as any;

    if (existing) {
      if (existing.email === normalizedEmail) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
      return res.status(400).json({ error: 'User with this phone number already exists' });
    }

    // Store pending registration in TTLCache — auto-expires in 10 min
    pendingRegCache.set(normalizedEmail, { name, phone, email: normalizedEmail }, 10 * 60 * 1000);

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpCache.set(normalizedEmail, { otp, expiresAt: Date.now() + OTP_TTL_MS }, OTP_TTL_MS);
    otpAttemptCache.delete(normalizedEmail);

    await sendOtpEmail(normalizedEmail, otp);

    res.json({ message: 'Registration OTP sent successfully to your email' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to initiate registration' });
  }
});

// ── 3. Verify OTP & Authenticate ─────────────────────────────────────────────
router.post('/verify-otp', async (req: Request, res: Response) => {
  const { phone: emailBody, email, otp } = req.body;
  const emailInput = email || emailBody;

  if (!emailInput || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const normalizedEmail = emailInput.toLowerCase().trim();

  // ── Staff bypass check ────────────────────────────────────────────────────
  // If this is a staff account (SuperAdmin / ShopAdmin / Delivery), issue a
  // token directly without validating OTP. Staff accounts don't go through
  // the email OTP flow — they use the direct login path in /send-otp.
  const existingUser = await User.findOne({ email: normalizedEmail }).lean() as any;
  const isStaffBypass = existingUser && STAFF_ROLES.includes(existingUser.role);

  if (isStaffBypass) {
    const token = generateToken(existingUser);
    return res.json({ user: existingUser, token });
  }

  // ── Brute-force lockout check ─────────────────────────────────────────────
  const attempts = otpAttemptCache.get(normalizedEmail) ?? 0;
  if (attempts >= OTP_MAX_ATTEMPTS) {
    return res.status(429).json({
      error: `Too many failed attempts. Please request a new OTP and try again in 15 minutes.`,
    });
  }

  // ── OTP validation ────────────────────────────────────────────────────────
  const record = otpCache.get(normalizedEmail);
  if (!record) {
    return res.status(401).json({ error: 'OTP expired or not requested. Please request a new one.' });
  }
  if (Date.now() > record.expiresAt) {
    otpCache.delete(normalizedEmail);
    return res.status(401).json({ error: 'OTP has expired. Please request a new one.' });
  }
  if (record.otp !== otp) {
    // Increment attempt counter — lock for 15 min after 5 failures
    otpAttemptCache.set(normalizedEmail, attempts + 1, OTP_LOCK_TTL_MS);
    const remaining = OTP_MAX_ATTEMPTS - (attempts + 1);
    return res.status(401).json({
      error: remaining > 0
        ? `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
        : 'Too many failed attempts. Please request a new OTP.',
    });
  }

  // OTP valid — clear both OTP and attempt counter
  otpCache.delete(normalizedEmail);
  otpAttemptCache.delete(normalizedEmail);

  try {
    let user = existingUser ? await User.findOne({ email: normalizedEmail }) : null;

    if (!user) {
      const pending = pendingRegCache.get(normalizedEmail);
      const name = pending
        ? pending.name
        : normalizedEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
      const phone = pending
        ? pending.phone
        : `99${Math.floor(10000000 + Math.random() * 90000000)}`;

      user = await User.create({ name, phone, email: normalizedEmail, role: 'Customer' });
      if (pending) pendingRegCache.delete(normalizedEmail);
    }

    const token = generateToken(user as any);
    res.json({ user, token });
  } catch (error) {
    console.error('Login verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Socket Event Helper ───────────────────────────────────────────────────────
const emitSocketEvent = (req: Request, event: string, data: any) => {
  const io = req.app.get('io');
  if (io) io.emit(event, data);
};

// ── 4. Create a new user (SuperAdmin or ShopAdmin) ────────────────────────────
router.post('/users', requireAuth, requireRole(['SuperAdmin', 'ShopAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, role, shopId, address } = req.body;
    let { phone } = req.body;

    let effectiveShopId = shopId || req.user!.shopId;

    if (req.user!.role === 'ShopAdmin') {
      if (role !== 'Delivery') {
        return res.status(403).json({ error: 'Shop Admins can only create Delivery staff' });
      }
      if (req.user!.shopId && shopId && shopId !== req.user!.shopId) {
        return res.status(403).json({ error: 'Cannot create Delivery staff for other branches' });
      }
      if (!req.user!.shopId && shopId) {
        effectiveShopId = shopId;
        await User.findByIdAndUpdate(req.user!._id, { shopId });
      }
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      existingUser.role = role || 'Delivery';
      if (effectiveShopId) existingUser.shopId = effectiveShopId;
      if (name && (!existingUser.name || existingUser.name === 'Delivery Staff' || existingUser.name === 'Customer')) {
        existingUser.name = name;
      }
      if (address) existingUser.address = address;
      await existingUser.save();
      res.status(200).json(existingUser);
      emitSocketEvent(req, 'user_updated', existingUser);
      return;
    }

    if (!phone || String(phone).trim().length !== 10) {
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        attempts++;
        phone = `99${Math.floor(10000000 + Math.random() * 90000000)}`;
        const phoneExists = await User.findOne({ phone });
        if (!phoneExists) isUnique = true;
      }
    } else {
      const phoneExists = await User.findOne({ phone: String(phone).trim() });
      if (phoneExists) {
        return res.status(400).json({ error: 'A user with this phone number already exists' });
      }
      phone = String(phone).trim();
    }

    const userName = name || normalizedEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Delivery Staff';

    const user = await User.create({
      name: userName,
      phone,
      email: normalizedEmail,
      role: role || 'Delivery',
      shopId: effectiveShopId,
      address: address || 'Shop Branch',
    });
    res.status(201).json(user);
    emitSocketEvent(req, 'user_created', user);
  } catch (err) {
    console.error('Failed to create user:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// ── GET /me — current user profile ───────────────────────────────────────────
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!._id).select('-__v').lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ── PUT /users/push-token ─────────────────────────────────────────────────────
router.put('/users/push-token', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { expoPushToken } = req.body;
    if (!expoPushToken) {
      return res.status(400).json({ error: 'Push token is required' });
    }
    const user = await User.findByIdAndUpdate(
      req.user!._id,
      { expoPushToken },
      { new: true }
    ).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Push token updated successfully', user });
    emitSocketEvent(req, 'user_updated', user);
  } catch (err) {
    console.error('Failed to update push token:', err);
    res.status(500).json({ error: 'Failed to update push token' });
  }
});

// ── PUT /users/me — update own profile ───────────────────────────────────────
router.put('/users/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const allowed = ['name', 'address', 'selectedWashPreferences', 'image'];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const user = await User.findByIdAndUpdate(req.user!._id, updates, { new: true }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
    emitSocketEvent(req, 'user_updated', user);
  } catch (err) {
    console.error('Failed to update profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ── PATCH /users/:id — SuperAdmin update any user ────────────────────────────
router.patch('/users/:id', requireAuth, requireRole(['SuperAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const allowed = ['name', 'phone', 'email', 'role', 'shopId', 'address', 'isActive'];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
    emitSocketEvent(req, 'user_updated', user);
  } catch (err) {
    console.error('Failed to update user:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ── DELETE /users/:id ─────────────────────────────────────────────────────────
router.delete('/users/:id', requireAuth, requireRole(['SuperAdmin', 'ShopAdmin']), async (req: AuthRequest, res: Response) => {
  try {
    const targetUser = await User.findById(req.params.id).select('role shopId').lean() as any;
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    if (req.user!.role === 'ShopAdmin') {
      const effectiveShopId = req.user!.shopId;
      if (targetUser.role !== 'Delivery') {
        return res.status(403).json({ error: 'Unauthorized to delete this user' });
      }
      if (effectiveShopId && targetUser.shopId && targetUser.shopId !== effectiveShopId) {
        return res.status(403).json({ error: 'Unauthorized to delete staff for other branches' });
      }
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
    emitSocketEvent(req, 'user_deleted', { userId: req.params.id });
  } catch (err) {
    console.error('Failed to delete user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ── GET /users — paginated, shop-scoped ──────────────────────────────────────
router.get('/users', requireAuth, requireRole(['SuperAdmin', 'ShopAdmin', 'Delivery']), async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 100);
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};

    if (req.user!.role === 'ShopAdmin' || req.user!.role === 'Delivery') {
      const effectiveShopId = (req.query.shopId as string) || req.user!.shopId;
      if (effectiveShopId) {
        query.$or = [
          { shopId: effectiveShopId },
          { role: 'Delivery', shopId: { $in: [effectiveShopId, null, '', undefined] } },
          { role: 'Customer' },
        ];
      } else {
        query.$or = [{ role: { $in: ['Delivery', 'Customer', 'ShopAdmin'] } }];
      }
    } else {
      // SuperAdmin: optional filters
      if (req.query.shopId) query.shopId = req.query.shopId;
      if (req.query.role) query.role = req.query.role;
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('_id name email phone role shopId isActive expoPushToken')
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Failed to fetch users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Running Independently Fallback
if (require.main === module) {
  const express = require('express');
  const app = express();
  app.use(express.json());
  app.use('/auth', router);

  const { connectDB } = require('@wow/shared');
  connectDB().then(() => {
    const port = process.env.PORT || 3001;
    app.listen(port, () => console.log(`Auth Service running on port ${port}`));
  });
}

export default router;
