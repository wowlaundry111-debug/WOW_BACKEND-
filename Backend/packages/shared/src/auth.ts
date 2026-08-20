import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IUser } from './types';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET environment variable is not set. Server cannot start in production without it.');
  }
  console.warn('\n[SECURITY WARNING] JWT_SECRET is not set. Using insecure default — this MUST be set in production via .env\n');
}
const jwtSecret = JWT_SECRET || 'wow-dev-only-jwt-secret-not-for-production';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const generateToken = (user: IUser) => {
  return jwt.sign({ _id: user._id, role: user.role, shopId: user.shopId }, jwtSecret, { expiresIn: '7d' });
};

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as IUser;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
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
