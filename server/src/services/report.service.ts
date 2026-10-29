import prisma from '../prisma';
import PDFDocument from 'pdfkit';
import { Response } from 'express';

export class ReportService {
  static async exportCSV(orgId: string, res: Response) {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    const records = await prisma.monthlyFinancial.findMany({
      where: { organization_id: orgId, deleted_at: null },
      orderBy: { period: 'desc' },
    });

    const curr = org?.currency_code || 'INR';

    const headers = [
      'Period',
      'Currency',
      'Total Revenue',
      'Payroll Expenses',
      'Goods Procurement',
      'Investments (CapEx)',
      'Overhead & Misc',
      'Total Expenses',
      'Net Profit',
      'Operating Margin (%)',
      'Notes',
    ];

    const rows = records.map((r) => [
      r.period.toISOString().substring(0, 10),
      curr,
      Number(r.total_revenue).toFixed(2),
      Number(r.payroll_expenses).toFixed(2),
      Number(r.goods_procurement).toFixed(2),
      Number(r.investments_capex).toFixed(2),
      Number(r.overhead_misc).toFixed(2),
      Number(r.total_expenses).toFixed(2),
      Number(r.net_profit).toFixed(2),
      Number(r.operating_margin).toFixed(2),
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="finpulse-report-${new Date().toISOString().substring(0, 10)}.csv"`
    );
    res.status(200).send(csvContent);
  }

  static async exportPDF(orgId: string, res: Response) {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    const records = await prisma.monthlyFinancial.findMany({
      where: { organization_id: orgId, deleted_at: null },
      orderBy: { period: 'desc' },
      take: 12,
    });

    const curr = org?.currency_code || 'INR';

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="finpulse-statement-${new Date().toISOString().substring(0, 10)}.pdf"`
    );

    doc.pipe(res);

    // Deep Slate Header Background
    doc.rect(0, 0, 612, 85).fill('#0F172A');

    // Title & Brand
    doc.fillColor('#10B981').fontSize(22).font('Helvetica-Bold').text('FinPulse', 40, 24);
    doc.fillColor('#94A3B8').fontSize(10).font('Helvetica').text('B2B Executive Financial Statement', 40, 50);

    // Organization Metadata
    doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold').text(org?.name || 'Apex Global Technologies', 400, 26, { align: 'right' });
    doc.fillColor('#94A3B8').fontSize(9).font('Helvetica').text(`Industry: ${org?.industry || 'Enterprise SaaS'}`, 400, 42, { align: 'right' });
    doc.fillColor('#94A3B8').fontSize(9).font('Helvetica').text(`Currency: ${curr} | Generated: ${new Date().toLocaleDateString()}`, 400, 56, { align: 'right' });

    doc.moveDown(4);

    // Section Title
    doc.fillColor('#0F172A').fontSize(14).font('Helvetica-Bold').text('Historical Monthly Financial Ledger', 40, 105);
    doc.fillColor('#64748B').fontSize(9).font('Helvetica').text('Audited enterprise metrics strictly matching Google Stitch schema standards.', 40, 122);

    // Table Header
    const tableTop = 145;
    doc.rect(40, tableTop, 532, 24).fill('#1E293B');
    doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
    doc.text('Period', 46, tableTop + 7);
    doc.text(`Revenue (${curr})`, 120, tableTop + 7);
    doc.text(`Expenses (${curr})`, 210, tableTop + 7);
    doc.text(`Net Profit (${curr})`, 300, tableTop + 7);
    doc.text('Margin', 390, tableTop + 7);
    doc.text('Status', 470, tableTop + 7);

    let y = tableTop + 24;
    records.forEach((r, idx) => {
      const bgColor = idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
      doc.rect(40, y, 532, 22).fill(bgColor);

      const rev = Number(r.total_revenue).toLocaleString();
      const exp = Number(r.total_expenses).toLocaleString();
      const profit = Number(r.net_profit).toLocaleString();
      const margin = `${Number(r.operating_margin).toFixed(1)}%`;
      const isProfitable = Number(r.net_profit) >= 0;

      doc.fillColor('#1E293B').fontSize(9).font('Helvetica').text(r.period.toISOString().substring(0, 7), 46, y + 6);
      doc.fillColor('#059669').fontSize(9).font('Helvetica-Bold').text(rev, 120, y + 6);
      doc.fillColor('#475569').fontSize(9).font('Helvetica').text(exp, 210, y + 6);
      doc.fillColor(isProfitable ? '#059669' : '#DC2626').fontSize(9).font('Helvetica-Bold').text(profit, 300, y + 6);
      doc.fillColor('#475569').fontSize(9).font('Helvetica').text(margin, 390, y + 6);
      doc.fillColor(isProfitable ? '#059669' : '#DC2626').fontSize(8).font('Helvetica-Bold').text(isProfitable ? 'PROFITABLE' : 'DEFICIT', 470, y + 6);

      y += 22;
    });

    doc.end();
  }
}
