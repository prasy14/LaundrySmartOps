import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { log } from "../vite";

declare module 'express' {
  interface Request {
    user?: {
      id: number;
      username: string;
      role: string;
      name: string;
      locationId?: number | null;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  log(`Auth check - Session ID: ${req.sessionID}`, 'auth');

  if (!req.isAuthenticated()) {
    log('Auth failed - Not authenticated', 'auth');
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

export const requireRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    log(`Role check - Session ID: ${req.sessionID}, Required roles: ${roles.join(',')}`, 'auth');

    if (!req.isAuthenticated()) {
      log('Role check failed - Not authenticated', 'auth');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = req.user;
    log(`Role check - User: ${user?.username}, Role: ${user?.role}`, 'auth');

    if (!user || !roles.includes(user.role)) {
      log(`Role check failed - User role ${user?.role} not in allowed roles: ${roles.join(',')}`, 'auth');
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
};

export const isAdmin = requireRole(['admin']);
export const isManagerOrAdmin = requireRole(['admin', 'manager']);
export const isOperatorOrAbove = requireRole(['admin', 'manager', 'operator']);