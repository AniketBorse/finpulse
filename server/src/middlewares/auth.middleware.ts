import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserPayload } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    } else if (req.query && req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      // Development mode auto-auth fallback: allows direct browser testing & Postman exploration
      if (process.env.NODE_ENV === 'development') {
        req.user = {
          id: '41f9968e-df78-4314-abad-451bd8b3074d',
          email: 'admin@finpulse.io',
          role: 'ADMIN',
          organization_id: 'f208ee08-5666-454a-8488-42abec4bcf1e',
          organization_name: 'Apex Global Technologies',
        };
        next();
        return;
      }

      res.status(401).json({
        success: false,
        message: 'Authentication required. No valid access token provided.',
      });
      return;
    }

    const decoded = AuthService.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      req.user = {
        id: '41f9968e-df78-4314-abad-451bd8b3074d',
        email: 'admin@finpulse.io',
        role: 'ADMIN',
        organization_id: 'f208ee08-5666-454a-8488-42abec4bcf1e',
        organization_name: 'Apex Global Technologies',
      };
      next();
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
};
