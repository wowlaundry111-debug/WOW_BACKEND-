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
  subject: `${otp} is your WOW Laundry verification code`,
  text: `Your WOW Laundry verification code is: ${otp}\n\nThis code is valid for 5 minutes. Please do not share this code with anyone.\n\nWOW LAUNDRY SERVICES LLP\nhttps://wowlaundry.in`,
  html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WOW Laundry Verification</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&display=swap');
    
    @keyframes pulseGlow {
      0%, 100% {
        box-shadow: 0 0 25px rgba(154, 230, 0, 0.45), 0 0 50px rgba(13, 141, 227, 0.25);
        border-color: #9AE600;
      }
      50% {
        box-shadow: 0 0 35px rgba(13, 141, 227, 0.55), 0 0 65px rgba(154, 230, 0, 0.4);
        border-color: #0D8DE3;
      }
    }
    
    @keyframes floatLogo {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-4px) rotate(1deg); }
    }
    
    @keyframes liveBlink {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.35; transform: scale(0.88); }
    }

    @keyframes shimmerBar {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    .glow-card {
      animation: pulseGlow 3s ease-in-out infinite;
    }

    .floating-logo {
      animation: floatLogo 4s ease-in-out infinite;
    }

    .live-dot {
      animation: liveBlink 1.5s ease-in-out infinite;
    }

    .shimmer-line {
      background: linear-gradient(90deg, transparent, #9AE600, #0D8DE3, transparent);
      background-size: 200% 100%;
      animation: shimmerBar 3s linear infinite;
    }

    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        border-radius: 16px !important;
      }
      .otp-digit {
        font-size: 34px !important;
        letter-spacing: 8px !important;
      }
      .content-padding {
        padding: 24px 18px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #06090E; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #FFFFFF;">
  
  <!-- Preheader preview text -->
  <div style="display: none; font-size: 1px; color: #06090E; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Your WOW Laundry verification code is ${otp}. Valid for 5 minutes.
  </div>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #06090E; padding: 40px 10px;">
    <tr>
      <td align="center">
        
        <!-- Main Email Wrapper -->
        <table role="presentation" class="email-container" width="560" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; width: 100%; background: #0E1422; border: 2px solid #1E293B; border-radius: 28px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);">
          
          <!-- Animated Top Gradient Accent Bar -->
          <tr>
            <td height="6" class="shimmer-line" style="height: 6px; background: linear-gradient(90deg, #0D8DE3, #9AE600, #0D8DE3); font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td align="center" style="padding: 36px 24px 20px; background: radial-gradient(circle at 50% 30%, rgba(13, 141, 227, 0.15), transparent 70%);">
              
              <!-- Logo Container with Animated Glow and Floating Effect -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div class="floating-logo" style="width: 80px; height: 80px; background: #000000; border: 2px solid #9AE600; border-radius: 50%; padding: 4px; box-shadow: 0 0 20px rgba(154, 230, 0, 0.35); text-align: center; line-height: 80px;">
                      <img src="https://www.wowlaundry.in/logo.png" alt="WOW Laundry" width="70" height="70" style="width: 70px; height: 70px; object-fit: contain; vertical-align: middle; border-radius: 50%; display: inline-block;" />
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Brand Name -->
              <h1 style="margin: 16px 0 4px; font-size: 24px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #FFFFFF;">
                WOW <span style="color: #0D8DE3;">LAUNDRY</span>
              </h1>
              <p style="margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #9AE600;">
                Premium Fabric Care &amp; Dry Cleaning
              </p>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td class="content-padding" style="padding: 20px 40px 32px;">
              
              <div style="background: #141B2D; border: 1px solid #1E293B; border-radius: 20px; padding: 28px 24px; text-align: center;">
                
                <span style="display: inline-block; background: rgba(154, 230, 0, 0.12); color: #9AE600; border: 1px solid rgba(154, 230, 0, 0.3); font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px;">
                  🔒 One-Time Security Code
                </span>

                <h2 style="margin: 0 0 10px; font-size: 20px; font-weight: 800; color: #FFFFFF; letter-spacing: 0.5px;">
                  Verify Your Account
                </h2>

                <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #94A3B8;">
                  Use the 6-digit verification code below to securely sign in to your WOW Laundry account.
                </p>

                <!-- Animated Glowing OTP Display -->
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center">
                      <div class="glow-card" style="display: inline-block; background: #000000; border: 2px solid #9AE600; border-radius: 16px; padding: 18px 32px; box-shadow: 0 0 25px rgba(154, 230, 0, 0.35); text-align: center; margin: 6px 0 16px;">
                        <span class="otp-digit" style="font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #9AE600; text-shadow: 0 0 16px rgba(154, 230, 0, 0.5); display: inline-block; padding-left: 10px;">
                          ${otp}
                        </span>
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Animated Live Timer Indicator -->
                <div style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; margin-top: 4px; font-size: 12px; font-weight: 700; color: #E2E8F0; background: rgba(0, 0, 0, 0.4); border: 1px solid #1E293B; border-radius: 20px; padding: 6px 14px;">
                  <span class="live-dot" style="display: inline-block; width: 8px; height: 8px; background-color: #9AE600; border-radius: 50%; box-shadow: 0 0 8px #9AE600; margin-right: 6px;"></span>
                  <span>Code expires in <strong style="color: #9AE600;">5 minutes</strong></span>
                </div>

              </div>

              <!-- Security Caution Note -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
                <tr>
                  <td style="background: rgba(239, 68, 68, 0.08); border-left: 3px solid #EF4444; border-radius: 8px; padding: 12px 16px;">
                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #FCA5A5;">
                      <strong>Security Tip:</strong> Never share this code with anyone. WOW Laundry representatives will never ask for your verification code. If you did not request this, please disregard this email.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Highlights Row -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 24px; border-top: 1px solid #1E293B; padding-top: 20px;">
                <tr>
                  <td width="33%" align="center" style="padding: 6px;">
                    <div style="font-size: 11px; font-weight: 800; color: #FFFFFF; text-transform: uppercase; letter-spacing: 0.8px;">⚡ 24h Express</div>
                    <div style="font-size: 10px; color: #64748B; margin-top: 2px;">Fast Turnaround</div>
                  </td>
                  <td width="33%" align="center" style="padding: 6px; border-left: 1px solid #1E293B; border-right: 1px solid #1E293B;">
                    <div style="font-size: 11px; font-weight: 800; color: #9AE600; text-transform: uppercase; letter-spacing: 0.8px;">🧼 100% Hygienic</div>
                    <div style="font-size: 10px; color: #64748B; margin-top: 2px;">Antiseptic Care</div>
                  </td>
                  <td width="33%" align="center" style="padding: 6px;">
                    <div style="font-size: 11px; font-weight: 800; color: #0D8DE3; text-transform: uppercase; letter-spacing: 0.8px;">🚚 Doorstep Pickup</div>
                    <div style="font-size: 10px; color: #64748B; margin-top: 2px;">Convenient &amp; Fast</div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td align="center" style="background: #090D16; border-top: 1px solid #1E293B; padding: 28px 24px;">
              <p style="margin: 0 0 6px; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #FFFFFF;">
                WOW LAUNDRY SERVICES LLP
              </p>
              <p style="margin: 0 0 12px; font-size: 11px; color: #64748B; line-height: 1.6;">
                📍 Branch 1: Rama Mandi, Jalandhar Cantt, Punjab<br/>
                📍 Branch 2: Shop No. 1 Gaba PG, Mughlai Point, Law Gate Maheru
              </p>
              <p style="margin: 0 0 12px; font-size: 11px; color: #64748B;">
                Need help? Contact <a href="mailto:wowlaundry111@gmail.com" style="color: #0D8DE3; text-decoration: none; font-weight: 600;">wowlaundry111@gmail.com</a> &bull; <span style="color: #E2E8F0;">+91 7814508706</span>
              </p>
              <p style="margin: 0; font-size: 10px; color: #475569;">
                &copy; ${new Date().getFullYear()} WOW Laundry. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `,
});

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
