require('dotenv').config();
import { PrismaClient, Prisma, UserRole, Currency, FiscalYearStatus, FiscalPeriodStatus, AccountType, TaxType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding essential production data (Users & Settings)...');

  // Create/Update System Users
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const ownerPassword = await bcrypt.hash('Owner@123', 12);
  const accountantPassword = await bcrypt.hash('Account@123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@rentflow.com' },
    update: {},
    create: {
      email: 'admin@rentflow.com',
      password: adminPassword,
      firstName: 'مدير',
      lastName: 'المنظومة',
      role: UserRole.ADMIN,
      phone: '+964700000000',
    },
  });

  await prisma.user.upsert({
    where: { email: 'owner@rentflow.com' },
    update: {},
    create: {
      email: 'owner@rentflow.com',
      password: ownerPassword,
      firstName: 'المالك',
      lastName: 'العقاري',
      role: UserRole.OWNER,
      phone: '+964700000001',
    },
  });

  await prisma.user.upsert({
    where: { email: 'accountant@rentflow.com' },
    update: {},
    create: {
      email: 'accountant@rentflow.com',
      password: accountantPassword,
      firstName: 'المحاسب',
      lastName: 'المالي',
      role: UserRole.ACCOUNTANT,
      phone: '+964700000002',
    },
  });

  console.log('✅ Base users prepared');

  // Global Settings
  const settingsCount = await prisma.systemSettings.count();
  if (settingsCount === 0) {
    await prisma.systemSettings.create({
      data: {
        organizationName: 'سند للعقارات',
        defaultCurrency: 'IQD',
        exchangeRateUSD: 1460.0,
        language: 'ar',
      },
    });
    console.log('✅ Global settings initialized');
  }

  // Fiscal Year Initialization
  const today = new Date();
  const currentYear = today.getFullYear();
  const fyName = `FY-${currentYear}`;

  const existingYear = await prisma.fiscalYear.findFirst({
    where: {
      startDate: { lte: today },
      endDate: { gte: today },
    },
  });

  if (!existingYear) {
    console.log(`🌱 Initializing ${fyName}...`);
    const startDate = new Date(Date.UTC(currentYear, 0, 1));
    const endDate = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999));

    await prisma.$transaction(async (tx) => {
      const fiscalYear = await tx.fiscalYear.create({
        data: {
          name: fyName,
          startDate,
          endDate,
          status: FiscalYearStatus.OPEN,
        },
      });

      const periods = [];
      for (let i = 1; i <= 12; i++) {
        const pStart = new Date(Date.UTC(currentYear, i - 1, 1));
        const pEnd = new Date(Date.UTC(currentYear, i, 0, 23, 59, 59, 999));
        periods.push({
          fiscalYearId: fiscalYear.id,
          periodNumber: i,
          name: pStart.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
          startDate: pStart,
          endDate: pEnd,
          status: FiscalPeriodStatus.OPEN,
        });
      }
      await tx.fiscalPeriod.createMany({ data: periods });
    });
    console.log(`✅ ${fyName} and 12 periods initialized`);
  }

  // System Accounts Seeding
  console.log('🌱 Seeding system accounts...');
  const systemAccounts = [
    { code: '1000', name: 'Cash', type: 'ASSET', subtype: 'CURRENT_ASSET' },
    { code: '1100', name: 'Accounts Receivable', type: 'ASSET', subtype: 'CURRENT_ASSET' },
    { code: '1200', name: 'Prepaid Rent', type: 'ASSET', subtype: 'CURRENT_ASSET' },
    { code: '1500', name: 'Security Deposit Asset', type: 'ASSET', subtype: 'CURRENT_ASSET' },
    { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', subtype: 'CURRENT_LIABILITY' },
    { code: '2100', name: 'Security Deposits Held', type: 'LIABILITY', subtype: 'CURRENT_LIABILITY' },
    { code: '2200', name: 'Deferred Revenue', type: 'LIABILITY', subtype: 'CURRENT_LIABILITY' },
    { code: '2300', name: 'Tax Payable', type: 'LIABILITY', subtype: 'CURRENT_LIABILITY' },
    { code: '2400', name: 'Accrued Expenses', type: 'LIABILITY', subtype: 'CURRENT_LIABILITY' },
    { code: '3000', name: 'Owner Equity', type: 'EQUITY', subtype: null },
    { code: '3100', name: 'Retained Earnings', type: 'EQUITY', subtype: null },
    { code: '3200', name: 'Drawings', type: 'EQUITY', subtype: null },
    { code: '4000', name: 'Rental Revenue', type: 'REVENUE', subtype: 'OPERATING_REVENUE' },
    { code: '4100', name: 'Late Fee Revenue', type: 'REVENUE', subtype: 'OPERATING_REVENUE' },
    { code: '4200', name: 'Other Revenue', type: 'REVENUE', subtype: 'OTHER_REVENUE' },
    { code: '4900', name: 'Bad Debt Recovered', type: 'REVENUE', subtype: 'OTHER_REVENUE' },
    { code: '5000', name: 'Maintenance Expense', type: 'EXPENSE', subtype: 'OPERATING_EXPENSE' },
    { code: '5100', name: 'Management Fee Expense', type: 'EXPENSE', subtype: 'OPERATING_EXPENSE' },
    { code: '5200', name: 'Utilities Expense', type: 'EXPENSE', subtype: 'OPERATING_EXPENSE' },
    { code: '5300', name: 'Insurance Expense', type: 'EXPENSE', subtype: 'OPERATING_EXPENSE' },
    { code: '5400', name: 'Bad Debt Expense', type: 'EXPENSE', subtype: 'OPERATING_EXPENSE' },
    { code: '5900', name: 'FX Gain/Loss', type: 'EXPENSE', subtype: 'OTHER_EXPENSE' },
  ];

  for (const sysAcc of systemAccounts) {
    await prisma.account.upsert({
      where: { code: sysAcc.code },
      update: {
        name: sysAcc.name,
        type: sysAcc.type as any,
        subtype: sysAcc.subtype,
        isSystem: true,
      },
      create: {
        code: sysAcc.code,
        name: sysAcc.name,
        type: sysAcc.type as any,
        subtype: sysAcc.subtype,
        isSystem: true,
      },
    });
  }
  console.log('✅ System accounts seeded.');

  // Tax Rates Seeding
  console.log('🌱 Seeding tax rates...');
  const taxPayableAccount = await prisma.account.findUnique({ where: { code: '2300' } });
  if (taxPayableAccount) {
    const taxRates = [
      {
        name: 'VAT 15%',
        code: 'VAT_15',
        rate: 0.15,
        type: TaxType.VAT,
        accountId: taxPayableAccount.id,
        isDefault: true,
        applicableFrom: new Date(currentYear, 0, 1),
      },
      {
        name: 'Withholding 5%',
        code: 'WHT_5',
        rate: 0.05,
        type: TaxType.WITHHOLDING,
        accountId: taxPayableAccount.id,
        isDefault: true,
        applicableFrom: new Date(currentYear, 0, 1),
      },
    ];

    for (const tr of taxRates) {
      await prisma.taxRate.upsert({
        where: { code: tr.code },
        update: {
          rate: new Prisma.Decimal(tr.rate),
          isActive: true,
        },
        create: {
          name: tr.name,
          code: tr.code,
          rate: new Prisma.Decimal(tr.rate),
          type: tr.type,
          accountId: tr.accountId,
          isDefault: tr.isDefault,
          applicableFrom: tr.applicableFrom,
        },
      });
    }
    console.log('✅ Tax rates seeded.');
  }

  console.log('🎉 System is now clean and ready for real data entry!');
  console.log('\n📋 Login credentials (CHANGE PASSWORDS IMMEDIATELY):');
  console.log('   Admin:      admin@rentflow.com / Admin@123');
  console.log('   Owner:      owner@rentflow.com / Owner@123');
  console.log('   Accountant: accountant@rentflow.com / Account@123');
}

main()
  .catch((e) => {
    console.error('❌ Data preparation failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
