import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { UserPayload } from '../types';
import { Role } from '@prisma/client';

export class AuthService {
  private static jwtSecret = process.env.JWT_SECRET || 'finpulse_jwt_secret_2026';
  private static jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'finpulse_refresh_secret_2026';

  static generateTokens(payload: UserPayload) {
    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: (process.env.JWT_EXPIRES_IN as any) || '30d',
    });

    const refreshToken = jwt.sign(payload, this.jwtRefreshSecret, {
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN as any) || '90d',
    });

    return { accessToken, refreshToken };
  }

  static verifyAccessToken(token: string): UserPayload {
    return jwt.verify(token, this.jwtSecret) as UserPayload;
  }

  static async switchRole(userId: string, newRole: Role) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      include: { organization: true },
    });

    const payload: UserPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      organization_id: user.organization_id,
      organization_name: user.organization.name,
    };

    const tokens = this.generateTokens(payload);
    return { user: payload, token: tokens.accessToken };
  }
}
