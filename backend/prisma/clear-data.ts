import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up database (removing experimental data)...');

  // Order matters due to foreign keys if not CASCADE
  // The schema has some CASCADE but let's be safe
  
  await prisma.attachment.deleteMany({});
  console.log('🗑️ Attachments cleared');

  await prisma.receipt.deleteMany({});
  console.log('🗑️ Receipts cleared');

  await prisma.payment.deleteMany({});
  console.log('🗑️ Payments cleared');

  await prisma.installment.deleteMany({});
  console.log('🗑️ Installments cleared');

  await prisma.lease.deleteMany({});
  console.log('🗑️ Leases cleared');

  await prisma.unit.deleteMany({});
  console.log('🗑️ Units cleared');

  await prisma.profitDistribution.deleteMany({});
  console.log('🗑️ ProfitDistributions cleared');

  await prisma.shareholder.deleteMany({});
  console.log('🗑️ Shareholders cleared');

  await prisma.asset.deleteMany({});
  console.log('🗑️ Assets cleared');

  await prisma.expense.deleteMany({});
  console.log('🗑️ Expenses cleared');

  await prisma.auditLog.deleteMany({});
  console.log('🗑️ AuditLogs cleared');

  await prisma.notification.deleteMany({});
  console.log('🗑️ Notifications cleared');

  await prisma.property.deleteMany({});
  console.log('🗑️ Properties cleared');

  await prisma.tenant.deleteMany({});
  console.log('🗑️ Tenants cleared');

  // Keep SystemSettings or reset them?
  // Usually keep them but maybe the user wants them clean too?
  // Let's reset to defaults if needed, or just leave them.
  // The request says "keep only users".
  
  console.log('✨ Cleanup completed. Only user accounts are preserved.');
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
