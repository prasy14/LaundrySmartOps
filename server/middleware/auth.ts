import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    name: string;
    locationId?: number;
  }
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

export const requireRole = (roles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    req.user = user;
    next();
  };
};

export const isAdmin = requireRole(['admin']);
export const isManagerOrAdmin = requireRole(['admin', 'manager']);
export const isOperatorOrAbove = requireRole(['admin', 'manager', 'operator']);
