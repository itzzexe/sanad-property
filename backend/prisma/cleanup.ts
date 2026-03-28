import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up database (Keeping users and settings)...');

  try {
    // Delete in reverse order of relationships
    await prisma.receipt.deleteMany();
    console.log('✅ Receipts cleared');

    await prisma.payment.deleteMany();
    console.log('✅ Payments cleared');

    await prisma.installment.deleteMany();
    console.log('✅ Installments cleared');

    await prisma.lease.deleteMany();
    console.log('✅ Leases cleared');

    await prisma.tenant.deleteMany();
    console.log('✅ Tenants cleared');

    await prisma.unit.deleteMany();
    console.log('✅ Units cleared');

    await prisma.profitDistribution.deleteMany();
    console.log('✅ Profit Distributions cleared');

    await prisma.shareholder.deleteMany();
    console.log('✅ Shareholders cleared');

    await prisma.asset.deleteMany();
    console.log('✅ Assets cleared');

    await prisma.expense.deleteMany();
    console.log('✅ Expenses cleared');

    await prisma.property.deleteMany();
    console.log('✅ Properties cleared');

    await prisma.notification.deleteMany();
    console.log('✅ Notifications cleared');

    await prisma.auditLog.deleteMany();
    console.log('✅ Audit Logs cleared');

    console.log('✨ Database is now clean and ready for use!');
    console.log('👥 Users kept:', await prisma.user.count());
    
    // Ensure one settings object exists
    const settingsCount = await prisma.systemSettings.count();
    if (settingsCount === 0) {
      await prisma.systemSettings.create({
        data: {
          organizationName: 'سند للعقارات',
          defaultCurrency: 'IQD',
          exchangeRateUSD: 1460.0,
          language: 'ar',
        }
      });
      console.log('⚙️ Default settings created');
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
