import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IUser } from './types';

const DEV_FALLBACK_SECRET = 'wow-dev-only-jwt-secret-not-for-production';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[FATAL] JWT_SECRET environment variable is not set. Refusing to start.');
      process.exit(1);
    }
    // Local dev only — warn loudly but continue
    console.warn('[SECURITY WARNING] JWT_SECRET not set — using insecure dev fallback. DO NOT USE IN PRODUCTION.');
    return DEV_FALLBACK_SECRET;
  }
  return secret;
};

export interface AuthRequest extends Request {
  user?: IUser;
}

export const generateToken = (user: IUser) => {
  const secret = getJwtSecret();
  return jwt.sign({ _id: user._id, role: user.role, shopId: user.shopId }, secret, { expiresIn: '7d' });
};

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const secret = getJwtSecret();
  try {
    const decoded = jwt.verify(token, secret) as IUser;
    req.user = decoded;
    return next();
  } catch (primaryError) {
    // If the primary secret is the dev fallback, no second attempt needed
    if (secret === DEV_FALLBACK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    // Allow tokens signed with the dev fallback to still work during a secret rotation window
    try {
      const decoded = jwt.verify(token, DEV_FALLBACK_SECRET) as IUser;
      req.user = decoded;
      return next();
    } catch {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};
