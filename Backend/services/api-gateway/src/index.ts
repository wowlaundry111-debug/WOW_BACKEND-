import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from the Backend root directory
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import { connectDB } from '@wow/shared';

// Import microservice routers
import authRouter from '@wow/auth-service';
import catalogRouter from '@wow/catalog-service';
import orderRouter from '@wow/order-service';
import uploadRouter from './uploadRoute';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());

// Compress all responses larger than 1KB — 6-10x bandwidth reduction
app.use(compression({ threshold: 1024 }));

app.use(express.json({ limit: '10mb' }));

// Request logger
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ── Service Routers ───────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/orders', orderRouter);
app.use('/api/upload', uploadRouter);

// ── Health Check ──────────────────────────────────────────────────────────────
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

  console.error(`[Unhandled Error] ${req.method} ${req.url}:`, err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Server Start ──────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API Gateway running on port ${PORT}`);

      // Keep-Alive Ping for Render Free Tier (every 4 minutes)
      // Only runs when RENDER_EXTERNAL_URL is explicitly set — never hardcoded
      const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
      if (RENDER_EXTERNAL_URL) {
        setInterval(() => {
          fetch(`${RENDER_EXTERNAL_URL}/api/health`)
            .then(() => console.log(`[Keep-Alive] Pinged ${RENDER_EXTERNAL_URL}/api/health`))
            .catch((err) => console.error(`[Keep-Alive] Ping failed:`, err.message));
        }, 4 * 60 * 1000);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
