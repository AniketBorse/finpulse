import prisma from '../prisma';
import { MonthlyFinancialInput } from '../types';

export class FinanceService {
  static calculateMetrics(input: {
    total_revenue: number;
    payroll_expenses: number;
    goods_procurement: number;
    investments_capex: number;
    overhead_misc: number;
  }) {
    const total_expenses =
      Number(input.payroll_expenses) +
      Number(input.goods_procurement) +
      Number(input.investments_capex) +
      Number(input.overhead_misc);

    const net_profit = Number(input.total_revenue) - total_expenses;
    const operating_margin =
      Number(input.total_revenue) > 0
        ? Number(((net_profit / Number(input.total_revenue)) * 100).toFixed(2))
        : 0;

    return {
      total_expenses,
      net_profit,
      operating_margin,
    };
  }

  static async getSummary(orgId: string, requestedPeriod?: string) {
    const entries = await prisma.monthlyFinancial.findMany({
      where: {
        organization_id: orgId,
        deleted_at: null,
      },
      orderBy: {
        period: 'asc',
      },
    });

    if (entries.length === 0) {
      return {
        kpis: {
          total_revenue: 0,
          revenue_mom_pct: 0,
          total_spend: 0,
          over_budget_pct: 0,
          net_profit: 0,
          operating_margin_pct: 0,
          cash_runway_months: 0,
          runway_status: 'No Data',
          cash_reserves: 0,
        },
        timeline: [],
        category_distribution: {
          payroll: 0,
          goods_procurement: 0,
          investments_capex: 0,
          overhead_misc: 0,
          percentages: { payroll: 0, goods_procurement: 0, investments_capex: 0, overhead_misc: 0 },
        },
        recent_entries: [],
      };
    }

    let current = entries[entries.length - 1];
    let currentIndex = entries.length - 1;

    if (requestedPeriod) {
      const matchIndex = entries.findIndex((e) => {
        const pStr = e.period.toISOString().substring(0, 7);
        return pStr === requestedPeriod || e.period.toISOString().startsWith(requestedPeriod);
      });
      if (matchIndex !== -1) {
        current = entries[matchIndex];
        currentIndex = matchIndex;
      }
    }

    const previous = currentIndex > 0 ? entries[currentIndex - 1] : null;

    const currentRev = Number(current.total_revenue);
    const prevRev = previous ? Number(previous.total_revenue) : currentRev;
    const revMomPct =
      prevRev > 0 ? Number((((currentRev - prevRev) / prevRev) * 100).toFixed(1)) : 0;

    const currentSpend = Number(current.total_expenses);
    const targetBudget = 274000;
    const overBudgetPct =
      currentSpend > targetBudget
        ? Number((((currentSpend - targetBudget) / targetBudget) * 100).toFixed(1))
        : 0;

    const currentProfit = Number(current.net_profit);
    const currentMargin = Number(current.operating_margin);

    const cashReserves = 5244000;
    const cashRunwayMonths =
      currentSpend > 0 ? Number((cashReserves / currentSpend).toFixed(1)) : 99;
    const runwayStatus =
      cashRunwayMonths >= 12
        ? 'Healthy'
        : cashRunwayMonths >= 6
        ? 'Moderate'
        : 'Critical';

    const timeline = entries.slice(-12).map((item) => {
      const date = new Date(item.period);
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      const formatted = `${monthNames[date.getUTCMonth()]} ${date.getUTCFullYear()}`;

      return {
        id: item.id,
        period: item.period.toISOString().substring(0, 10),
        formatted_period: formatted,
        revenue: Number(item.total_revenue),
        expenses: Number(item.total_expenses),
        profit: Number(item.net_profit),
        margin: Number(item.operating_margin),
      };
    });

    const payroll = Number(current.payroll_expenses);
    const goods = Number(current.goods_procurement);
    const capex = Number(current.investments_capex);
    const overhead = Number(current.overhead_misc);
    const totalExp = currentSpend > 0 ? currentSpend : 1;

    const category_distribution = {
      payroll,
      goods_procurement: goods,
      investments_capex: capex,
      overhead_misc: overhead,
      percentages: {
        payroll: Number(((payroll / totalExp) * 100).toFixed(1)),
        goods_procurement: Number(((goods / totalExp) * 100).toFixed(1)),
        investments_capex: Number(((capex / totalExp) * 100).toFixed(1)),
        overhead_misc: Number(((overhead / totalExp) * 100).toFixed(1)),
      },
    };

    const recent_entries = [...entries]
      .reverse()
      .slice(0, 6)
      .map((item) => ({
        id: item.id,
        period: item.period.toISOString().substring(0, 10),
        total_revenue: Number(item.total_revenue),
        total_expenses: Number(item.total_expenses),
        net_profit: Number(item.net_profit),
        operating_margin: Number(item.operating_margin),
        payroll_expenses: Number(item.payroll_expenses),
        goods_procurement: Number(item.goods_procurement),
        investments_capex: Number(item.investments_capex),
        overhead_misc: Number(item.overhead_misc),
        notes: item.notes,
        status:
          Number(item.net_profit) > 0
            ? 'Profitable'
            : Number(item.net_profit) === 0
            ? 'Break-even'
            : 'Deficit',
      }));

    return {
      kpis: {
        total_revenue: currentRev,
        revenue_mom_pct: revMomPct,
        total_spend: currentSpend,
        over_budget_pct: overBudgetPct,
        net_profit: currentProfit,
        operating_margin_pct: currentMargin,
        cash_runway_months: cashRunwayMonths,
        runway_status: runwayStatus,
        cash_reserves: cashReserves,
      },
      current_period: current.period.toISOString().substring(0, 7),
      timeline,
      category_distribution,
      recent_entries,
    };
  }

  static async getMonthly(orgId: string, options: { page?: number; limit?: number; sortBy?: string; order?: 'asc' | 'desc'; search?: string; year?: string }) {
    const page = options.page || 1;
    const limit = options.limit || 12;
    const skip = (page - 1) * limit;

    const where: any = {
      organization_id: orgId,
      deleted_at: null,
    };

    if (options.search) {
      where.notes = { contains: options.search };
    }

    const [items, total] = await Promise.all([
      prisma.monthlyFinancial.findMany({
        where,
        skip,
        take: limit,
        orderBy: { period: options.order || 'desc' },
      }),
      prisma.monthlyFinancial.count({ where }),
    ]);

    const formatted = items.map((item) => ({
      ...item,
      total_revenue: Number(item.total_revenue),
      payroll_expenses: Number(item.payroll_expenses),
      goods_procurement: Number(item.goods_procurement),
      investments_capex: Number(item.investments_capex),
      overhead_misc: Number(item.overhead_misc),
      total_expenses: Number(item.total_expenses),
      net_profit: Number(item.net_profit),
      operating_margin: Number(item.operating_margin),
      status: Number(item.net_profit) > 0 ? 'Profitable' : Number(item.net_profit) === 0 ? 'Break-even' : 'Deficit',
    }));

    return {
      items: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async createMonthly(orgId: string, userId: string, input: MonthlyFinancialInput, ip?: string) {
    const computed = this.calculateMetrics(input);

    let periodDate: Date;
    if (input.period.length === 7) {
      periodDate = new Date(`${input.period}-01T00:00:00.000Z`);
    } else {
      periodDate = new Date(input.period);
    }

    const record = await prisma.monthlyFinancial.upsert({
      where: {
        organization_id_period: {
          organization_id: orgId,
          period: periodDate,
        },
      },
      update: {
        total_revenue: input.total_revenue,
        payroll_expenses: input.payroll_expenses,
        goods_procurement: input.goods_procurement,
        investments_capex: input.investments_capex,
        overhead_misc: input.overhead_misc,
        total_expenses: computed.total_expenses,
        net_profit: computed.net_profit,
        operating_margin: computed.operating_margin,
        notes: input.notes,
        deleted_at: null,
      },
      create: {
        organization_id: orgId,
        period: periodDate,
        total_revenue: input.total_revenue,
        payroll_expenses: input.payroll_expenses,
        goods_procurement: input.goods_procurement,
        investments_capex: input.investments_capex,
        overhead_misc: input.overhead_misc,
        total_expenses: computed.total_expenses,
        net_profit: computed.net_profit,
        operating_margin: computed.operating_margin,
        notes: input.notes,
      },
    });

    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: `Created monthly financial report for ${input.period} (Revenue: ${input.total_revenue}, Spend: ${computed.total_expenses})`,
        ip_address: ip || '127.0.0.1',
      },
    });

    return record;
  }

  static async updateMonthly(id: string, orgId: string, userId: string, input: Partial<MonthlyFinancialInput>, ip?: string) {
    const existing = await prisma.monthlyFinancial.findUnique({
      where: { id },
    });

    if (!existing || existing.organization_id !== orgId) {
      throw new Error('Financial entry not found or unauthorized access.');
    }

    const rev = input.total_revenue !== undefined ? input.total_revenue : Number(existing.total_revenue);
    const payroll = input.payroll_expenses !== undefined ? input.payroll_expenses : Number(existing.payroll_expenses);
    const goods = input.goods_procurement !== undefined ? input.goods_procurement : Number(existing.goods_procurement);
    const capex = input.investments_capex !== undefined ? input.investments_capex : Number(existing.investments_capex);
    const overhead = input.overhead_misc !== undefined ? input.overhead_misc : Number(existing.overhead_misc);

    const computed = this.calculateMetrics({
      total_revenue: rev,
      payroll_expenses: payroll,
      goods_procurement: goods,
      investments_capex: capex,
      overhead_misc: overhead,
    });

    const updated = await prisma.monthlyFinancial.update({
      where: { id },
      data: {
        total_revenue: rev,
        payroll_expenses: payroll,
        goods_procurement: goods,
        investments_capex: capex,
        overhead_misc: overhead,
        total_expenses: computed.total_expenses,
        net_profit: computed.net_profit,
        operating_margin: computed.operating_margin,
        notes: input.notes !== undefined ? input.notes : existing.notes,
      },
    });

    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: `Updated financial entry ${id} (New Net Profit: ${computed.net_profit})`,
        ip_address: ip || '127.0.0.1',
      },
    });

    return updated;
  }

  static async deleteMonthly(id: string, orgId: string, userId: string, ip?: string) {
    const existing = await prisma.monthlyFinancial.findUnique({
      where: { id },
    });

    if (!existing || existing.organization_id !== orgId) {
      throw new Error('Financial entry not found or unauthorized access.');
    }

    const softDeleted = await prisma.monthlyFinancial.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: `Soft-deleted financial entry ${id} for period ${existing.period.toISOString().substring(0, 7)}`,
        ip_address: ip || '127.0.0.1',
      },
    });

    return softDeleted;
  }
}
