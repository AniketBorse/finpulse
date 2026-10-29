import { Request, Response, NextFunction } from 'express';
import { FinanceService } from '../services/finance.service';

export class FinanceController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const period = req.query.period as string | undefined;
      const summary = await FinanceService.getSummary(req.user!.organization_id, period);
      res.status(200).json({ success: true, data: summary });
    } catch (e) {
      next(e);
    }
  }

  static async getMonthly(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, sortBy, order, search, year } = req.query;
      const result = await FinanceService.getMonthly(req.user!.organization_id, {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 12,
        sortBy: sortBy as string,
        order: (order as any) || 'desc',
        search: search as string,
        year: year as string,
      });
      res.status(200).json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  }

  static async createMonthly(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const record = await FinanceService.createMonthly(req.user!.organization_id, req.user!.id, req.body, req.ip);
      res.status(201).json({ success: true, data: record });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message || 'Failed to create financial entry.' });
    }
  }

  static async updateMonthly(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await FinanceService.updateMonthly(id, req.user!.organization_id, req.user!.id, req.body, req.ip);
      res.status(200).json({ success: true, data: updated });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message || 'Failed to update financial entry.' });
    }
  }

  static async deleteMonthly(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await FinanceService.deleteMonthly(id, req.user!.organization_id, req.user!.id, req.ip);
      res.status(200).json({ success: true, message: 'Financial entry soft-deleted successfully.', data: deleted });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message || 'Failed to delete financial entry.' });
    }
  }
}
