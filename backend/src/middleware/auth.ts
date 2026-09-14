import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'USER' | 'ADMIN';
  };
}

export const authenticateRole = (allowedRoles: Array<'USER' | 'ADMIN'>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key') as {
        id: number;
        role: 'USER' | 'ADMIN';
      };

      if (!allowedRoles.includes(payload.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied: Role '${payload.role}' is not authorized.`
        });
      }

      req.user = { id: String(payload.id), role: payload.role };
      next();
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
    }
  };
};