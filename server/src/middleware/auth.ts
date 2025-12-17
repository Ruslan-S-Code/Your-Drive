import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    req.userEmail = payload.email;
    console.log('[Auth] Token verified:', { userId: payload.userId, email: payload.email });
    next();
  } catch (error) {
    console.error('[Auth] Token verification failed:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

