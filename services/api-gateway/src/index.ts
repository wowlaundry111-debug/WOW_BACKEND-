import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from the Backend root directory
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import { connectDB } from '@wow/shared';
import { log, requestLogger } from './logger';

// Import microservice routers
import authRouter from '@wow/auth-service';
import catalogRouter from '@wow/catalog-service';
import orderRouter from '@wow/order-service';
import uploadRouter from './uploadRoute';

const app = express();
const server = http.createServer(app);

// CORS configuration — allow environment override or defaults
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : '*';

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  },
  // Tune Socket.IO for production: tighten ping/pong to detect dead connections faster
  pingTimeout: 20000,
  pingInterval: 25000,
  // Use WebSocket-first transport — avoids HTTP long-poll overhead at scale
  transports: ['websocket', 'polling'],
  // Max 1MB per socket message — prevents large payload abuse
  maxHttpBufferSize: 1e6,
});

// Socket.IO connection handling — clients join their shop room for targeted broadcasts
io.on('connection', (socket) => {
  const shopId = socket.handshake.query.shopId as string;
  const role = socket.handshake.query.role as string;
  const userId = socket.handshake.query.userId as string;

  if (shopId) {
    socket.join(`shop:${shopId}`);
  }
  if (userId) {
    socket.join(`user:${userId}`);
  }

  log.debug('Socket connected', { id: socket.id, shopId, role });

  socket.on('disconnect', (reason) => {
    log.debug('Socket disconnected', { id: socket.id, reason });
  });
});

// Export io so other modules can emit events
export { io };
app.set('io', io);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// ── Middleware ────────────────────────────────────────────────────────────────

// Disable x-powered-by header for security
app.disable('x-powered-by');

// Security headers — Helmet
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// CORS middleware
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Compress all responses larger than 1KB — 6-10x bandwidth reduction
app.use(compression({ threshold: 1024 }));

// Hardened body parser limit: 2MB for standard API payloads
app.use(express.json({ limit: '2mb' }));

// Structured async request logger (replaces blocking console.log)
app.use(requestLogger());

// ── Tiered Rate Limiting ──────────────────────────────────────────────────────

// Helper: shared rate limit response
const rateLimitHandler = (req: Request, res: Response) => {
  log.warn('Rate limit hit', { ip: req.ip, url: req.url });
  res.status(429).json({
    error: 'Too many requests. Please slow down and try again shortly.',
    retryAfter: res.getHeader('Retry-After'),
  });
};

// 1. OTP send — strictest: 5 requests per 15 minutes per IP
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  validate: { keyGeneratorIpFallback: false },
  skip: () => process.env.NODE_ENV !== 'production', // Skip in dev
});

// 2. OTP verify — 10 requests per 15 minutes per IP
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  validate: { keyGeneratorIpFallback: false },
  skip: () => process.env.NODE_ENV !== 'production',
});

// 3. Order creation — 30 orders per minute per IP (burst protection)
const orderCreateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  validate: { keyGeneratorIpFallback: false },
});

// 4. Global API fallback — 300 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  validate: { keyGeneratorIpFallback: false },
  skip: (req) => req.path === '/health' || req.path === '/api/health',
});

app.use(globalLimiter);

// ── Service Routers (with targeted rate limiters) ─────────────────────────────
app.use('/api/auth/send-otp', otpSendLimiter);
app.use('/api/auth/verify-otp', otpVerifyLimiter);
app.use('/api/auth', authRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/orders', orderCreateLimiter); // applies to POST /api/orders
app.use('/api/orders', orderRouter);
app.use('/api/upload', uploadRouter);

// ── Health Check ──────────────────────────────────────────────────────────────
app.all('/', (_req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'WOW API Gateway is running', uptime: process.uptime() });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'API Gateway is running', uptime: process.uptime() });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'API Gateway is running', uptime: process.uptime() });
});

app.get('/api', (_req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'WOW API Gateway running' });
});

// ── Centralized Error Handler ─────────────────────────────────────────────────
// Must be registered AFTER all routes
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  // Mongoose cast error (bad ObjectId / string id)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  // MongoDB duplicate key (unique index violation)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ error: `${field} already exists` });
  }
  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  log.error('Unhandled route error', {
    method: req.method,
    url: req.url,
    error: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  // Production security: do not leak internal stack trace or raw error objects to clients
  const isProduction = process.env.NODE_ENV === 'production';
  const errorMessage = isProduction ? 'An unexpected error occurred on the server' : (err.message || 'Internal server error');

  res.status(err.status || 500).json({ error: errorMessage });
});

// ── Process-Level Safety Nets ─────────────────────────────────────────────────

// Prevent unhandled promise rejections from crashing the process
process.on('unhandledRejection', (reason: any) => {
  log.error('Unhandled promise rejection', {
    reason: reason?.message || String(reason),
    stack: reason?.stack,
  });
  // Do NOT exit — log and continue. The request that caused it already failed.
});

// Catch synchronous throws that escaped all try/catch blocks
process.on('uncaughtException', (err: Error) => {
  log.error('Uncaught exception — initiating graceful shutdown', {
    error: err.message,
    stack: err.stack,
  });
  // An uncaught exception means the app is in an undefined state — must restart
  gracefulShutdown('uncaughtException');
});

// ── Graceful Shutdown ─────────────────────────────────────────────────────────

let isShuttingDown = false;

function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  log.info(`Received ${signal} — starting graceful shutdown`);

  // Stop accepting new connections
  server.close((err) => {
    if (err) {
      log.error('Error during server close', { error: err.message });
      process.exit(1);
    }
    log.info('HTTP server closed — all connections drained');
    process.exit(0);
  });

  // Force-kill after 30 seconds if connections don't drain (Render gives 30s)
  const forceKillTimer = setTimeout(() => {
    log.error('Graceful shutdown timed out after 30s — forcing exit');
    process.exit(1);
  }, 30_000);

  // Don't let this timer block shutdown itself
  if (forceKillTimer.unref) forceKillTimer.unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ── Server Start ──────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, '0.0.0.0', () => {
      log.info('API Gateway started', { port: PORT, env: process.env.NODE_ENV || 'development' });

      // Keep-Alive Ping for Render Free Tier (every 4 minutes)
      // Only runs when RENDER_EXTERNAL_URL is explicitly set — never hardcoded
      const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
      if (RENDER_EXTERNAL_URL) {
        setInterval(() => {
          fetch(`${RENDER_EXTERNAL_URL}/api/health`)
            .then(() => log.debug('Keep-alive ping sent', { url: RENDER_EXTERNAL_URL }))
            .catch((err) => log.warn('Keep-alive ping failed', { error: err.message }));
        }, 4 * 60 * 1000);
      }
    });
  } catch (error: any) {
    log.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

startServer();
