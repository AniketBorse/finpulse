import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

export class OrgController {
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthenticated' });
        return;
      }
      const org = await prisma.organization.findUnique({
        where: { id: req.user.organization_id },
        include: {
          users: { select: { id: true, email: true, role: true, created_at: true } },
          _count: { select: { financials: true } },
        },
      });
      res.status(200).json({ success: true, data: org });
    } catch (e) {
      next(e);
    }
  }

  static async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthenticated' });
        return;
      }
      const { name, industry, currency_code } = req.body;
      const updated = await prisma.organization.update({
        where: { id: req.user.organization_id },
        data: {
          ...(name ? { name } : {}),
          ...(industry ? { industry } : {}),
          ...(currency_code ? { currency_code } : {}),
        },
      });
      res.status(200).json({ success: true, data: updated });
    } catch (e) {
      next(e);
    }
  }
}
