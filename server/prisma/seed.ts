import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding FinPulse MySQL database...');

  await prisma.auditLog.deleteMany({});
  await prisma.monthlyFinancial.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});

  const org = await prisma.organization.create({
    data: {
      id: 'f208ee08-5666-454a-8488-42abec4bcf1e',
      name: 'Apex Global Technologies',
      industry: 'Enterprise SaaS & FinTech',
      currency_code: 'INR',
    },
  });

  const passwordHash = await bcrypt.hash('FinPulse2026!', 10);

  const admin = await prisma.user.create({
    data: {
      id: '41f9968e-df78-4314-abad-451bd8b3074d',
      organization_id: org.id,
      email: 'admin@finpulse.io',
      password_hash: passwordHash,
      role: Role.ADMIN,
    },
  });

  await prisma.user.create({
    data: {
      id: '5538cdc1-520e-4f18-934c-78c5206f75e6',
      organization_id: org.id,
      email: 'viewer@finpulse.io',
      password_hash: passwordHash,
      role: Role.VIEWER,
    },
  });

  const baselineMonths = [
    { period: '2025-11-01', revenue: 300000, payroll: 120000, goods: 48000, capex: 20000, overhead: 24000, notes: 'Q4 baseline entry.' },
    { period: '2025-12-01', revenue: 310000, payroll: 124000, goods: 50000, capex: 30000, overhead: 24000, notes: 'End of year sales renewals and infrastructure upgrades.' },
    { period: '2026-01-01', revenue: 315000, payroll: 128000, goods: 49000, capex: 22000, overhead: 25000, notes: 'Annual budget resets and enterprise client onboarding.' },
    { period: '2026-02-01', revenue: 328000, payroll: 130000, goods: 51000, capex: 24000, overhead: 26000, notes: 'Series B scaling initiatives; 2 senior engineering hires.' },
    { period: '2026-03-01', revenue: 342000, payroll: 133000, goods: 53000, capex: 28000, overhead: 26000, notes: 'Q1 close: beat ARR target by 8.4%.' },
    { period: '2026-04-01', revenue: 335000, payroll: 135000, goods: 52000, capex: 26000, overhead: 27000, notes: 'Seasonal adjustments; marketing campaigns launched.' },
    { period: '2026-05-01', revenue: 350000, payroll: 140000, goods: 55000, capex: 32000, overhead: 28000, notes: 'New multi-currency payment rail rollout.' },
    { period: '2026-06-01', revenue: 365000, payroll: 144000, goods: 58000, capex: 30000, overhead: 28000, notes: 'Mid-year financial review; expanded procurement tier.' },
    { period: '2026-07-01', revenue: 360000, payroll: 146000, goods: 56000, capex: 34000, overhead: 29000, notes: 'EU market pilot setup and compliance certification.' },
    { period: '2026-08-01', revenue: 375000, payroll: 148000, goods: 59000, capex: 35000, overhead: 29000, notes: 'Expansion in fintech banking partners pipeline.' },
    { period: '2026-09-01', revenue: 373665, payroll: 150000, goods: 60000, capex: 36000, overhead: 30000, notes: 'Record pipeline conversion prior to Q4 contract closings.' },
    { period: '2026-10-01', revenue: 420000, payroll: 155000, goods: 62000, capex: 38000, overhead: 30000, notes: 'Current month - Record revenue with 32.1% net operating margin.' },
    { period: '2026-11-01', revenue: 450000, payroll: 140000, goods: 85000, capex: 30000, overhead: 35000, notes: 'Projected expansion following Q4 pipeline conversion.' },
  ];

  for (const m of baselineMonths) {
    const totalExpenses = m.payroll + m.goods + m.capex + m.overhead;
    const netProfit = m.revenue - totalExpenses;
    const margin = Number(((netProfit / m.revenue) * 100).toFixed(2));

    await prisma.monthlyFinancial.create({
      data: {
        organization_id: org.id,
        period: new Date(m.period),
        total_revenue: m.revenue,
        payroll_expenses: m.payroll,
        goods_procurement: m.goods,
        investments_capex: m.capex,
        overhead_misc: m.overhead,
        total_expenses: totalExpenses,
        net_profit: netProfit,
        operating_margin: margin,
        notes: m.notes,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      user_id: admin.id,
      action: 'Seeded initial 12-month baseline financial datasets matching Stitch dashboard.',
      ip_address: '127.0.0.1',
    },
  });

  console.log('Seeding complete! Seeded 13 monthly records.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
