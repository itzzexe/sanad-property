import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStatus() {
  const counts = {
    'العقارات (Properties)': await prisma.property.count(),
    'الوحدات (Units)': await prisma.unit.count(),
    'المستأجرين (Tenants)': await prisma.tenant.count(),
    'العقود (Leases)': await prisma.lease.count(),
    'المدفوعات (Payments)': await prisma.payment.count(),
    'الأقساط (Installments)': await prisma.installment.count(),
    'الأصول (Assets)': await prisma.asset.count(),
    'المصاريف (Expenses)': await prisma.expense.count(),
    'المساهمين (Shareholders)': await prisma.shareholder.count(),
    'المستخدمين (Users)': await prisma.user.count(),
    'الإعدادات (Settings)': await prisma.systemSettings.count()
  };

  console.log('\n📊 ملخص حال قاعدة البيانات الآن:');
  console.log('--------------------------------');
  Object.entries(counts).forEach(([key, value]) => {
    console.log(`${key.padEnd(25)}: ${value}`);
  });
  
  if (counts['العقارات (Properties)'] === 0 && counts['المستأجرين (Tenants)'] === 0) {
    console.log('\n✅ قاعدة البيانات نظيفة تماماً من البيانات التجريبية وجاهزة للعمل الحقيقي.');
  }
}

checkStatus()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
