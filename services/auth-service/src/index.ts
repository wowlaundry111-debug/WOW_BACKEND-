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
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const router = Router();

// ── Email Sender (Resend primary, nodemailer fallback for local dev) ──────────
//
// WHY: Render blocks outbound SMTP ports 25, 465, and 587 at the platform level.
// Gmail SMTP therefore silently fails on Render. Resend uses HTTPS (port 443)
// so it works on every hosting platform with zero firewall issues.
//
// Setup:
//   1. Create a free account at https://resend.com
//   2. Verify your sending domain (or use the onboarding sandbox address)
//   3. Create an API key and add it as RESEND_API_KEY on Render's env vars
//   4. Set RESEND_FROM to "WOW Laundry <noreply@yourdomain.com>"
//      (if unverified domain, use "WOW Laundry <onboarding@resend.dev>" for testing)

const OTP_EMAIL_TEMPLATE = (otp: string) => ({
  subject: 'WOW Laundry Verification Code',
  text: `Your WOW Laundry verification code is ${otp}. It is valid for 5 minutes. Do not share this code with anyone.`,
  html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #0D8DE3; text-align: center;">WOW Laundry Verification</h2>
      <p>Hello,</p>
      <p>Your one-time verification code is:</p>
      <div style="font-size: 40px; font-weight: bold; letter-spacing: 8px; text-align: center; margin: 30px 0; color: #0D8DE3; background: #f0f9ff; border-radius: 8px; padding: 16px;">${otp}</div>
      <p style="color: #666;">This code is valid for <strong>5 minutes</strong>. Please do not share this code with anyone.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">WOW Laundry &bull; Premium Laundry Services</p>
    </div>
  `,
});

async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const from = (process.env.RESEND_FROM || 'WOW Laundry <onboarding@resend.dev>').trim();
  const template = OTP_EMAIL_TEMPLATE(otp);

  // ── Primary: Resend (works on Render, no SMTP port issues) ────────────────
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const { data, error } = await resend.emails.send({
        from,
        to: [email],
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      if (error) {
        console.error(`[Resend Error] Failed to send OTP to ${email}:`, error);
        return false;
      }
      console.log(`[Resend Success] OTP sent to ${email} (id: ${data?.id})`);
      return true;
    } catch (err: any) {
      console.error(`[Resend Exception] ${email}:`, err.message || err);
      return false;
    }
  }

  // ── Fallback: nodemailer for local dev (requires SMTP_USER + SMTP_PASS) ──
  // NOTE: This path will NOT work on Render because Render blocks SMTP ports.
  //       Always set RESEND_API_KEY in your Render environment variables.
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim().replace(/^["']|["']$/g, '').replace(/\s+/g, '');

  if (!smtpUser || !smtpPass) {
    // Neither Resend nor SMTP is configured — log OTP to server console (dev only)
    console.warn(`[Email Not Configured] OTP for ${email}: ${otp}`);
    return false;
  }

  try {
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;
    const localTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: isSecure,
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
    const info = await localTransporter.sendMail({
      from: `"WOW Laundry" <${smtpUser}>`,
      to: email,
      ...template,
    });
    console.log(`[SMTP Success] OTP sent to ${email} (MessageId: ${info.messageId})`);
    return true;
  } catch (err: any) {
    console.error(`[SMTP Error] Failed to send OTP to ${email}:`, err.message || err);
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

// ── Helper: Find user by email, phone, or identifier ───────────────────────────
async function findUserByIdentifier(identifier: string) {
  if (!identifier) return null;
  const clean = identifier.trim();
  const normalizedEmail = clean.toLowerCase();

  const aliasEmail = normalizedEmail.includes('@wowlaundry.com')
    ? normalizedEmail.replace('@wowlaundry.com', '@wow.com')
    : normalizedEmail.includes('@wow.com')
      ? normalizedEmail.replace('@wow.com', '@wowlaundry.com')
      : null;

  return await User.findOne({
    $or: [
      { email: normalizedEmail },
      { phone: clean },
      ...(aliasEmail ? [{ email: aliasEmail }] : []),
      ...((clean.length === 24 && /^[0-9a-fA-F]{24}$/.test(clean)) ? [{ _id: clean }] : [])
    ]
  }).lean() as any;
}

// ── 1. Direct Login Flow (replaces OTP requirement) ───────────────────────────
const handleDirectLogin = async (req: Request, res: Response) => {
  const { email, phone, identifier, password } = req.body;
  const rawInput = identifier || email || phone;

  if (!rawInput || String(rawInput).trim().length < 2) {
    return res.status(400).json({ error: 'Email, mobile number, or User ID is required' });
  }

  const cleanInput = String(rawInput).trim();
  let user = await findUserByIdentifier(cleanInput);

  // If user exists, check optional password if user has one configured
  if (user) {
    if (user.password && password && user.password !== password) {
      return res.status(401).json({ error: 'Invalid password. Please check and try again.' });
    }

    const token = generateToken(user);
    return res.json({
      message: 'Authenticated successfully',
      directLogin: true,
      user,
      token,
    });
  }

  // If user does not exist, auto-create a Customer profile for instant access
  try {
    const isEmail = cleanInput.includes('@');
    const normalizedEmail = isEmail
      ? cleanInput.toLowerCase()
      : `user.${cleanInput.replace(/[^0-9]/g, '') || Math.floor(1000 + Math.random() * 9000)}@wow.com`;

    let userPhone = !isEmail && cleanInput.replace(/[^0-9]/g, '').length === 10
      ? cleanInput.replace(/[^0-9]/g, '')
      : `99${Math.floor(10000000 + Math.random() * 90000000)}`;

    // Ensure phone uniqueness
    let existingPhone = await User.findOne({ phone: userPhone });
    while (existingPhone) {
      userPhone = `99${Math.floor(10000000 + Math.random() * 90000000)}`;
      existingPhone = await User.findOne({ phone: userPhone });
    }

    const defaultName = cleanInput.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Customer';

    const newUser = await User.create({
      name: defaultName,
      phone: userPhone,
      email: normalizedEmail,
      role: 'Customer',
      password: password || '',
    });

    const token = generateToken(newUser as any);
    return res.json({
      message: 'Account created and authenticated successfully',
      directLogin: true,
      user: newUser,
      token,
    });
  } catch (err: any) {
    console.error('Direct login auto-provision error:', err);
    return res.status(500).json({ error: 'Failed to authenticate user' });
  }
};

// Route aliases for login
router.post('/login', handleDirectLogin);
router.post('/send-otp', handleDirectLogin);

// ── 2. Register User (New Customer Account Creation) ────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  const { name, phone, email, password } = req.body;
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Full name is required (minimum 2 characters)' });
  }
  if (!phone || String(phone).trim().replace(/[^0-9]/g, '').length !== 10) {
    return res.status(400).json({ error: 'Valid 10-digit mobile number is required' });
  }
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email address is required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const cleanPhone = String(phone).trim().replace(/[^0-9]/g, '');

  try {
    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: cleanPhone }]
    }).lean() as any;

    if (existing) {
      // Account already exists — do NOT silently sign them in as another user.
      // Return a clear conflict error so the client prompts them to sign in instead.
      return res.status(409).json({
        error: 'An account with this email or phone already exists. Please sign in instead.',
      });
    }

    const newUser = await User.create({
      name: name.trim(),
      phone: cleanPhone,
      email: normalizedEmail,
      role: 'Customer',
      password: password || '',
    });

    const token = generateToken(newUser as any);
    res.status(201).json({
      message: 'Account created successfully! You are now signed in.',
      directLogin: true,
      user: newUser,
      token,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Failed to register' });
  }
});

// ── 2b. Staff-Only Login (Website Portal) ────────────────────────────────────────
// The Website portal is for ShopAdmin, SuperAdmin, and Delivery staff only.
// Customers must use the mobile app. This endpoint enforces that restriction.
router.post('/staff-login', async (req: Request, res: Response) => {
  const { email, phone, identifier, password } = req.body;
  const rawInput = identifier || email || phone;

  if (!rawInput || String(rawInput).trim().length < 2) {
    return res.status(400).json({ error: 'Email, mobile number, or User ID is required' });
  }

  const cleanInput = String(rawInput).trim();
  const user = await findUserByIdentifier(cleanInput);

  if (!user) {
    return res.status(404).json({ error: 'No account found with this email or phone. Please contact your administrator.' });
  }

  // Only allow staff roles to log in via the website portal
  const allowedRoles = ['SuperAdmin', 'ShopAdmin', 'Delivery'] as const;
  if (!(allowedRoles as readonly string[]).includes(user.role)) {
    return res.status(403).json({
      error: 'This portal is for staff only. Customers must use the WOW Laundry mobile app.',
    });
  }

  // Check password if user has one set
  if (user.password && password && user.password !== password) {
    return res.status(401).json({ error: 'Invalid password. Please check and try again.' });
  }

  const token = generateToken(user);
  return res.json({
    message: 'Authenticated successfully',
    directLogin: true,
    user,
    token,
  });
});

// ── 3. Verify OTP Bypass (for backwards compatibility) ─────────────────────────
router.post('/verify-otp', async (req: Request, res: Response) => {
  const { phone: emailBody, email, identifier, password } = req.body;
  const rawInput = identifier || email || emailBody;

  if (!rawInput) {
    return res.status(400).json({ error: 'Email or phone is required' });
  }

  const cleanInput = String(rawInput).trim();
  let user = await findUserByIdentifier(cleanInput);

  if (!user) {
    const normalizedEmail = cleanInput.includes('@')
      ? cleanInput.toLowerCase()
      : `user.${cleanInput.replace(/[^0-9]/g, '') || Math.floor(1000 + Math.random() * 9000)}@wow.com`;

    const userPhone = cleanInput.replace(/[^0-9]/g, '').length === 10
      ? cleanInput.replace(/[^0-9]/g, '')
      : `99${Math.floor(10000000 + Math.random() * 90000000)}`;

    user = await User.create({
      name: normalizedEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      phone: userPhone,
      email: normalizedEmail,
      role: 'Customer',
      password: password || '',
    });
  }

  const token = generateToken(user as any);
  res.json({ user, token, directLogin: true });
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
