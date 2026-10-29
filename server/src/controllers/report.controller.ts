import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';

export class ReportController {
  static async export(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const format = (req.query.format as string) || 'csv';
      const orgId = req.user!.organization_id;
      if (format.toLowerCase() === 'pdf') {
        await ReportService.exportPDF(orgId, res);
      } else {
        await ReportService.exportCSV(orgId, res);
      }
    } catch (e) {
      next(e);
    }
  }
}
