import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "@shared/schema";

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      email: string;
      role: string;
      createdAt: Date;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!req.session.userRole || !roles.includes(req.session.userRole as UserRole)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}
