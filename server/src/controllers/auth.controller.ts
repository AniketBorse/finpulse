import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { AuthService } from '../services/auth.service';
import { Role } from '@prisma/client';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, organizationName, industry } = req.body;
      if (!email || !password) {
        res.status(400).json({ success: false, message: 'Email and password required' });
        return;
      }
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        res.status(409).json({ success: false, message: 'Email already registered' });
        return;
      }
      const org = await prisma.organization.create({
        data: {
          name: organizationName || 'My Organization',
          industry: industry || 'Technology',
          currency_code: 'INR',
        },
      });
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          organization_id: org.id,
          email,
          password_hash: passwordHash,
          role: Role.ADMIN,
        },
      });
      const tokens = AuthService.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
        organization_id: org.id,
        organization_name: org.name,
      });
      res.status(201).json({ success: true, data: { user, token: tokens.accessToken } });
    } catch (e) {
      next(e);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ success: false, message: 'Email and password are required.' });
        return;
      }
      const user = await prisma.user.findUnique({
        where: { email },
        include: { organization: true },
      });
      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }
      const tokens = AuthService.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id,
        organization_name: user.organization.name,
      });
      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            organization_id: user.organization_id,
            organization_name: user.organization.name,
          },
          token: tokens.accessToken,
        },
      });
    } catch (e) {
      next(e);
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  }

  static async me(req: Request, res: Response): Promise<void> {
    res.status(200).json({ success: true, data: { user: req.user } });
  }

  static async switchRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role } = req.body;
      if (!req.user || !role) {
        res.status(400).json({ success: false, message: 'Role is required' });
        return;
      }
      const result = await AuthService.switchRole(req.user.id, role);
      res.status(200).json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }
}
