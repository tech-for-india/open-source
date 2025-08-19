import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../models/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: 'SUPERADMIN' | 'ADMIN' | 'USER';
    displayName: string;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        role: true,
        displayName: true,
        mustChangePassword: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles: ('SUPERADMIN' | 'ADMIN' | 'USER')[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireSuperAdmin = requireRole(['SUPERADMIN']);
export const requireAdmin = requireRole(['SUPERADMIN', 'ADMIN']);
export const requireUser = requireRole(['SUPERADMIN', 'ADMIN', 'USER']);
