import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { log } from "../vite";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    name: string;
    locationId?: number | null;
  }
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  log(`Auth check - Session ID: ${req.sessionID}, User ID: ${req.session.userId}`, 'auth');

  if (!req.session.userId) {
    log('Auth failed - No user ID in session', 'auth');
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

export const requireRole = (roles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    log(`Role check - Session ID: ${req.sessionID}, User ID: ${req.session.userId}, Required roles: ${roles.join(',')}`, 'auth');

    if (!req.session.userId) {
      log('Role check failed - No user ID in session', 'auth');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await storage.getUser(req.session.userId);
    log(`Role check - Found user: ${user?.username}, Role: ${user?.role}`, 'auth');

    if (!user || !roles.includes(user.role)) {
      log(`Role check failed - User role ${user?.role} not in allowed roles: ${roles.join(',')}`, 'auth');
      return res.status(403).json({ message: 'Forbidden' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      locationId: user.locationId
    };
    next();
  };
};

export const isAdmin = requireRole(['admin']);
export const isManagerOrAdmin = requireRole(['admin', 'manager']);
export const isOperatorOrAbove = requireRole(['admin', 'manager', 'operator']);