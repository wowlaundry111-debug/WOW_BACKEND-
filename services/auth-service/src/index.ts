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

const OTP_EMAIL_TEMPLATE = (otp: string) => {
  const digits = String(otp || '000000').trim().padEnd(6, '0').slice(0, 6).split('');

  return {
    subject: `${otp} is your WOW Laundry verification code`,
    text: `Your WOW Laundry verification code is: ${otp}\n\nThis code is valid for 5 minutes. Do not share this code with anyone.\n\nWOW LAUNDRY SERVICES LLP\nhttps://wowlaundry.in`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WOW Laundry Verification Code</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&display=swap');
    
    @keyframes liveBlink {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.3; transform: scale(0.85); }
    }

    @keyframes popIn {
      0% { transform: scale(0.92); }
      50% { transform: scale(1.04); }
      100% { transform: scale(1); }
    }

    .live-dot {
      animation: liveBlink 1.4s ease-in-out infinite;
    }

    .digit-box {
      animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }

    @media only screen and (max-width: 600px) {
      .email-card {
        padding: 20px 14px !important;
        border-radius: 20px !important;
      }
      .digit-box {
        width: 38px !important;
        height: 48px !important;
        line-height: 44px !important;
        font-size: 24px !important;
        border-radius: 8px !important;
      }
      .logo-circle {
        width: 70px !important;
        height: 70px !important;
      }
      .logo-img {
        width: 56px !important;
        height: 56px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0D8DE3; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #000000;">
  
  <!-- Preheader text for inbox preview -->
  <div style="display: none; font-size: 1px; color: #0D8DE3; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Your WOW Laundry verification code is ${otp}. Valid for 5 minutes.
  </div>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0D8DE3; padding: 20px 10px;">
    <tr>
      <td align="center">
        
        <!-- Max Width Wrapper (No Scroll Compact) -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 480px; width: 100%;">
          
          <!-- MAIN NEO-BRUTALIST WHITE CARD -->
          <tr>
            <td>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="email-card" style="background: #FFFFFF; border: 3px solid #000000; border-radius: 24px; box-shadow: 6px 6px 0px #000000; padding: 26px 22px; text-align: center;">
                
                <!-- WOW Laundry Logo in Black Background Circle -->
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                      <tr>
                        <td align="center" valign="middle" class="logo-circle" style="width: 76px; height: 76px; background-color: #000000; border: 3px solid #000000; border-radius: 50%; text-align: center; vertical-align: middle; box-shadow: 3px 3px 0px rgba(0,0,0,0.15);">
                          <img src="https://www.wowlaundry.in/logo.png" alt="WOW Laundry" class="logo-img" width="58" height="58" style="width: 58px; height: 58px; max-width: 58px; max-height: 58px; display: block; margin: 0 auto; object-fit: contain;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Heading & Brand Title -->
                <tr>
                  <td align="center">
                    <h1 style="margin: 0 0 4px; font-size: 20px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 1px; font-family: 'Lilita One', 'Outfit', Impact, Arial Black, sans-serif;">
                      ENTER VERIFICATION CODE
                    </h1>
                    <p style="margin: 0 0 16px; font-size: 12px; font-weight: 700; color: #4B5563; text-transform: uppercase; letter-spacing: 0.5px;">
                      Use the 6-digit code below to sign in
                    </p>
                  </td>
                </tr>

                <!-- 6 INDIVIDUAL OTP DIGIT BOXES (Matches Website Login) -->
                <tr>
                  <td align="center" style="padding: 4px 0 12px;">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: auto;">
                      <tr>
                        ${digits.map((d, i) => `
                        <td align="center" style="padding: 0 3px;">
                          <div class="digit-box" style="width: 44px; height: 52px; background: #9AE600; border: 3px solid #000000; border-radius: 10px; box-shadow: 3px 3px 0px #000000; text-align: center; line-height: 48px; font-size: 28px; font-weight: 900; color: #000000; font-family: 'Lilita One', 'Outfit', Impact, Arial Black, sans-serif;">
                            ${d}
                          </div>
                        </td>
                        `).join('')}
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Live Expiry Badge -->
                <tr>
                  <td align="center" style="padding-top: 4px;">
                    <div style="display: inline-block; background: #000000; color: #9AE600; border: 2px solid #000000; border-radius: 999px; padding: 5px 16px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; box-shadow: 2px 2px 0px #000000;">
                      <span class="live-dot" style="display: inline-block; width: 7px; height: 7px; background-color: #9AE600; border-radius: 50%; box-shadow: 0 0 5px #9AE600; margin-right: 5px; vertical-align: middle;"></span>
                      Code expires in 5 minutes
                    </div>
                  </td>
                </tr>

                <!-- Security Tip Box (No Emojis) -->
                <tr>
                  <td style="padding-top: 14px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="background: #FAF8F5; border: 2px solid #000000; border-radius: 10px; box-shadow: 2px 2px 0px #000000; padding: 8px 12px; text-align: center;">
                          <p style="margin: 0; font-size: 10px; font-weight: 800; color: #000000; line-height: 1.4; text-transform: uppercase; letter-spacing: 0.3px;">
                            Never share this OTP. WOW Laundry staff will never ask for your code.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Compact Integrated Footer (No Branches, Clean & Quick) -->
                <tr>
                  <td style="padding-top: 16px;">
                    <div style="border-top: 2px dashed #E5E7EB; padding-top: 12px; text-align: center;">
                      <div style="font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #000000; font-family: 'Lilita One', 'Outfit', Impact, Arial Black, sans-serif;">
                        WOW LAUNDRY SERVICES LLP
                      </div>
                      <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #6B7280; margin-top: 2px;">
                        Wear Fresh and Feel Fresh
                      </div>
                      <div style="font-size: 10px; color: #6B7280; margin-top: 4px;">
                        Need help? <a href="mailto:wowlaundry111@gmail.com" style="color: #0D8DE3; text-decoration: underline; font-weight: 700;">wowlaundry111@gmail.com</a> &bull; +91 7814508706
                      </div>
                    </div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
    `,
  };
};

async function sendOtpEmail(email: string, otp: string): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const from = (process.env.RESEND_FROM || 'WOW Laundry <noreply@wowlaundry.in>').trim();
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
        return { success: false, error: (error as any).message || JSON.stringify(error) };
      }
      console.log(`[Resend Success] OTP sent to ${email} (id: ${data?.id})`);
      return { success: true };
    } catch (err: any) {
      console.error(`[Resend Exception] ${email}:`, err.message || err);
      return { success: false, error: err.message || 'Failed to communicate with email service' };
    }
  }

  // ── Fallback: nodemailer for local dev (requires SMTP_USER + SMTP_PASS) ──
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim().replace(/^["']|["']$/g, '').replace(/\s+/g, '');

  if (!smtpUser || !smtpPass) {
    console.warn(`[Email Not Configured] OTP for ${email}: ${otp}`);
    return { success: false, error: 'Email service is not configured (RESEND_API_KEY missing)' };
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
    return { success: true };
  } catch (err: any) {
    console.error(`[SMTP Error] Failed to send OTP to ${email}:`, err.message || err);
    return { success: false, error: err.message || 'SMTP delivery failed' };
  }
}

// ── OTP Brute-Force Constants ─────────────────────────────────────────────────

const OTP_TTL_MS = 5 * 60 * 1000;       // 5 minutes OTP validity
const OTP_MAX_ATTEMPTS = 5;              // lock after 5 wrong guesses
const OTP_LOCK_TTL_MS = 15 * 60 * 1000; // 15 minute lockout window

// ── Staff roles that bypass OTP entirely ─────────────────────────────────────
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

// ── 1. Send OTP / Login Flow ──────────────────────────────────────────────────
// - If staff account (SuperAdmin, ShopAdmin, Delivery) -> direct login without OTP!
// - If user does not exist -> immediately raise 404 error
// - Otherwise (Customer) -> generate 6-digit OTP, send via Resend, store in otpCache
router.post('/send-otp', async (req: Request, res: Response) => {
  const { email, phone, identifier, password } = req.body;
  const rawInput = identifier || email || phone;

  if (!rawInput || String(rawInput).trim().length < 2) {
    return res.status(400).json({ error: 'Email or mobile number is required' });
  }

  const cleanInput = String(rawInput).trim();
  const normalizedEmail = cleanInput.toLowerCase();
  let user = await findUserByIdentifier(cleanInput);

  // If user is not registered, immediately raise an error
  if (!user) {
    return res.status(404).json({
      error: 'No account found with this email. Please register first.'
    });
  }

  // ── Staff Accounts (SuperAdmin, ShopAdmin, Delivery) bypass OTP entirely ────
  const isStaff = user.role === 'SuperAdmin' || user.role === 'ShopAdmin' || user.role === 'Delivery';
  if (isStaff) {
    // If staff account has a password set and caller supplied one, verify it
    if (user.password && password && user.password !== password) {
      return res.status(401).json({ error: 'Invalid password. Please check and try again.' });
    }

    const token = generateToken(user);
    console.log(`[Staff Direct Login] Bypass OTP for ${user.role} (${user.email || user.phone})`);
    return res.json({
      message: 'Authenticated successfully',
      directLogin: true,
      requiresOtp: false,
      user,
      token,
    });
  }

  // ── Customers require OTP ───────────────────────────────────────────────────
  const targetEmail = user.email;
  if (!targetEmail) {
    const token = generateToken(user);
    return res.json({ directLogin: true, user, token });
  }

  // Generate 6-digit OTP
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  otpCache.set(targetEmail, { otp, expiresAt: Date.now() + OTP_TTL_MS }, OTP_TTL_MS);

  const result = await sendOtpEmail(targetEmail, otp);
  if (!result.success) {
    return res.status(500).json({
      error: `Failed to deliver verification code: ${result.error || 'Please try again later'}`
    });
  }

  return res.json({
    requiresOtp: true,
    email: targetEmail,
    message: `Verification code sent to ${targetEmail}. Please check your inbox.`,
  });
});

// Direct login alias (backward compatibility for mobile app or direct callers)
router.post('/login', async (req: Request, res: Response) => {
  const { email, phone, identifier, password, otp } = req.body;
  const rawInput = identifier || email || phone;

  if (!rawInput || String(rawInput).trim().length < 2) {
    return res.status(400).json({ error: 'Email, mobile number, or User ID is required' });
  }

  const cleanInput = String(rawInput).trim();
  const normalizedEmail = cleanInput.toLowerCase();

  // If OTP is provided, verify OTP and complete login
  if (otp) {
    const targetEmail = normalizedEmail.includes('@') ? normalizedEmail : null;
    if (!targetEmail) return res.status(400).json({ error: 'Valid email is required with OTP' });

    const cachedOtpEntry = otpCache.get(targetEmail);
    const storedOtp = typeof cachedOtpEntry === 'object' && cachedOtpEntry !== null ? cachedOtpEntry.otp : cachedOtpEntry;

    if (!storedOtp || String(otp).trim() !== storedOtp) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    otpCache.delete(targetEmail);

    let user = await findUserByIdentifier(targetEmail);
    if (!user) {
      const pendingData = pendingRegCache.get(targetEmail) as any;
      const defaultName = pendingData?.name || targetEmail.split('@')[0];
      const defaultPhone = pendingData?.phone || `99${Math.floor(10000000 + Math.random() * 90000000)}`;
      user = await User.create({
        name: defaultName,
        phone: defaultPhone,
        email: targetEmail,
        role: 'Customer',
      });
      pendingRegCache.delete(targetEmail);
    }

    const token = generateToken(user as any);
    return res.json({ message: 'Authenticated successfully', directLogin: true, user, token });
  }

  // Direct login for staff or password users
  let user = await findUserByIdentifier(cleanInput);
  if (user) {
    if (user.password && password && user.password !== password) {
      return res.status(401).json({ error: 'Invalid password. Please check and try again.' });
    }
    const token = generateToken(user);
    return res.json({ message: 'Authenticated successfully', directLogin: true, user, token });
  }

  // Auto-create customer if no password required (mobile app flow)
  try {
    const isEmail = cleanInput.includes('@');
    const userEmail = isEmail ? normalizedEmail : `user.${cleanInput.replace(/[^0-9]/g, '') || Math.floor(1000 + Math.random() * 9000)}@wow.com`;
    let userPhone = !isEmail && cleanInput.replace(/[^0-9]/g, '').length === 10
      ? cleanInput.replace(/[^0-9]/g, '')
      : `99${Math.floor(10000000 + Math.random() * 90000000)}`;

    const defaultName = cleanInput.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Customer';
    const newUser = await User.create({
      name: defaultName,
      phone: userPhone,
      email: userEmail,
      role: 'Customer',
      password: password || '',
    });

    const token = generateToken(newUser as any);
    return res.json({ message: 'Account created and authenticated', directLogin: true, user: newUser, token });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to authenticate user' });
  }
});

// ── 2. Register — Step 1: Validate & Send OTP ─────────────────────────────────
// Customers submit their details → we send an OTP to their email for verification.
// Staff accounts are pre-created in the DB and use /login directly (no OTP).
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
    // Check for duplicate email or phone
    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: cleanPhone }]
    }).lean() as any;

    if (existing) {
      return res.status(409).json({
        error: 'An account with this email or phone already exists. Please sign in.',
      });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Store pending registration data keyed by email (TTL: 10 min)
    pendingRegCache.set(normalizedEmail, { name: name.trim(), phone: cleanPhone, email: normalizedEmail, password: password || '' } as any, 10 * 60 * 1000);
    otpCache.set(normalizedEmail, { otp, expiresAt: Date.now() + OTP_TTL_MS }, OTP_TTL_MS);

    // Send OTP via Resend
    const result = await sendOtpEmail(normalizedEmail, otp);
    if (!result.success) {
      return res.status(500).json({
        error: `Failed to deliver verification code: ${result.error || 'Please check your email address and try again'}`
      });
    }

    return res.json({
      requiresOtp: true,
      message: `Verification code sent to ${normalizedEmail}. Please check your inbox.`,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: error.message || 'Failed to start registration' });
  }
});

// ── 3. Verify OTP → Create Account & Return Token ─────────────────────────────
router.post('/verify-otp', async (req: Request, res: Response) => {
  const { phone: emailBody, email, identifier, otp } = req.body;
  const rawInput = identifier || email || emailBody;

  if (!rawInput) {
    return res.status(400).json({ error: 'Email or phone is required' });
  }

  const cleanInput = String(rawInput).trim().toLowerCase();

  // ── New registration OTP verification flow ───────────────────────────────
  const pendingData = pendingRegCache.get(cleanInput) as any;
  const cachedOtpEntry = otpCache.get(cleanInput);
  const storedOtp = typeof cachedOtpEntry === 'object' && cachedOtpEntry !== null ? cachedOtpEntry.otp : cachedOtpEntry;

  if (pendingData && storedOtp) {
    const attempts = (otpAttemptCache.get(cleanInput) as number) || 0;
    if (attempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ error: 'Too many incorrect attempts. Please try again in 15 minutes.' });
    }

    if (!otp || String(otp).trim() !== storedOtp) {
      otpAttemptCache.set(cleanInput, attempts + 1, OTP_LOCK_TTL_MS);
      const remaining = OTP_MAX_ATTEMPTS - (attempts + 1);
      return res.status(400).json({
        error: `Invalid verification code. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : 'Account locked — try again later.'}`,
      });
    }

    // OTP correct — clean caches
    pendingRegCache.delete(cleanInput);
    otpCache.delete(cleanInput);
    otpAttemptCache.delete(cleanInput);

    try {
      // Guard against duplicate created while OTP was in-flight
      const duplicate = await User.findOne({
        $or: [{ email: pendingData.email }, { phone: pendingData.phone }]
      }).lean() as any;

      if (duplicate) {
        const token = generateToken(duplicate);
        return res.json({ user: duplicate, token, directLogin: true });
      }

      const newUser = await User.create({
        name: pendingData.name,
        phone: pendingData.phone,
        email: pendingData.email,
        role: 'Customer',
        password: pendingData.password,
      });

      const token = generateToken(newUser as any);
      return res.status(201).json({
        message: 'Account verified and created!',
        user: newUser,
        token,
        directLogin: true,
      });
    } catch (err: any) {
      console.error('Account creation after OTP error:', err);
      return res.status(500).json({ error: 'Failed to create account. Please try again.' });
    }
  }

  // ── Legacy: existing user lookup (no pending registration) ───────────────
  const user = await findUserByIdentifier(cleanInput);
  if (!user) {
    return res.status(404).json({ error: 'No pending registration found. Please register first.' });
  }

  const token = generateToken(user as any);
  return res.json({ user, token, directLogin: true });
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
