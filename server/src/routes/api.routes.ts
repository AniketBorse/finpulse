import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { OrgController } from '../controllers/org.controller';
import { FinanceController } from '../controllers/finance.controller';
import { ReportController } from '../controllers/report.controller';
import { AuditController } from '../controllers/audit.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { Role } from '@prisma/client';

const router = Router();

// API Discovery Index
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    name: 'FinPulse Enterprise B2B SaaS REST API',
    version: 'v1.0.0',
    web_app_url: 'http://localhost:4200',
    health_check: 'http://localhost:5000/api/health',
    endpoints: {
      auth: {
        login: 'POST /api/v1/auth/login',
        register: 'POST /api/v1/auth/register',
        logout: 'POST /api/v1/auth/logout',
        me: 'GET /api/v1/auth/me',
        switch_role: 'POST /api/v1/auth/switch-role'
      },
      organizations: {
        get_profile: 'GET /api/v1/organizations/me',
        update_profile: 'PUT /api/v1/organizations/me'
      },
      finances: {
        summary: 'GET /api/v1/finances/summary',
        monthly_ledger: 'GET /api/v1/finances/monthly',
        create_monthly: 'POST /api/v1/finances/monthly',
        update_monthly: 'PUT /api/v1/finances/monthly/:id',
        delete_monthly: 'DELETE /api/v1/finances/monthly/:id'
      },
      reports: {
        export: 'GET /api/v1/reports/export?format=pdf|csv'
      },
      audit: {
        logs: 'GET /api/v1/audit-logs'
      }
    }
  });
});

// Auth
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.post('/auth/logout', authenticate, AuthController.logout);
router.get('/auth/me', authenticate, AuthController.me);
router.post('/auth/switch-role', authenticate, AuthController.switchRole);

// Org
router.get('/organizations/me', authenticate, OrgController.getMe);
router.put('/organizations/me', authenticate, requireRole([Role.ADMIN]), OrgController.updateMe);

// Finance
router.get('/finances/summary', authenticate, FinanceController.getSummary);
router.get('/finances/monthly', authenticate, FinanceController.getMonthly);
router.post('/finances/monthly', authenticate, requireRole([Role.ADMIN]), FinanceController.createMonthly);
router.put('/finances/monthly/:id', authenticate, requireRole([Role.ADMIN]), FinanceController.updateMonthly);
router.delete('/finances/monthly/:id', authenticate, requireRole([Role.ADMIN]), FinanceController.deleteMonthly);

// Reports
router.get('/reports/export', authenticate, ReportController.export);

// Audit
router.get('/audit-logs', authenticate, AuditController.getLogs);

export default router;
