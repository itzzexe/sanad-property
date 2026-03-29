import { PrismaClient, UserRole, Currency } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
  });
