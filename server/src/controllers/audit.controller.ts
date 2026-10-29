import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

export class AuditController {
  static async getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = await prisma.auditLog.findMany({
        where: { user: { organization_id: req.user!.organization_id } },
        orderBy: { timestamp: 'desc' },
        take: 50,
      });
      res.status(200).json({ success: true, data: logs });
    } catch (e) {
      next(e);
    }
  }
}
