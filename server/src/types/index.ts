import { Role } from '@prisma/client';

export interface UserPayload {
  id: string;
  email: string;
  role: Role;
  organization_id: string;
  organization_name?: string;
}

export interface MonthlyFinancialInput {
  period: string;
  total_revenue: number;
  payroll_expenses: number;
  goods_procurement: number;
  investments_capex: number;
  overhead_misc: number;
  notes?: string;
}
