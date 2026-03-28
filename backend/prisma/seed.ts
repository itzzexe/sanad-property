import { PrismaClient, UserRole, UnitType, UnitStatus, Currency, PaymentFrequency, PaymentMethod } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create users
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const ownerPassword = await bcrypt.hash('Owner@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@rentflow.com' },
    update: {},
    create: {
      email: 'admin@rentflow.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      phone: '+1234567890',
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@rentflow.com' },
    update: {},
    create: {
      email: 'owner@rentflow.com',
      password: ownerPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.OWNER,
      phone: '+1987654321',
    },
  });

  const accountant = await prisma.user.upsert({
    where: { email: 'accountant@rentflow.com' },
    update: {},
    create: {
      email: 'accountant@rentflow.com',
      password: await bcrypt.hash('Account@123', 12),
      firstName: 'Sarah',
      lastName: 'Wilson',
      role: UserRole.ACCOUNTANT,
      phone: '+1555666777',
    },
  });

  console.log('✅ Users created');

  // Create properties
  const property1 = await prisma.property.create({
    data: {
      name: 'Sunrise Tower',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      country: 'US',
      zipCode: '10001',
      description: 'A luxury residential tower with 20 floors',
      ownerId: owner.id,
    },
  });

  const property2 = await prisma.property.create({
    data: {
      name: 'Ocean View Apartments',
      address: '456 Beach Boulevard',
      city: 'Miami',
      state: 'FL',
      country: 'US',
      zipCode: '33139',
      description: 'Beachfront apartments with stunning ocean views',
      ownerId: owner.id,
    },
  });

  const property3 = await prisma.property.create({
    data: {
      name: 'Downtown Business Center',
      address: '789 Commerce Ave',
      city: 'Chicago',
      state: 'IL',
      country: 'US',
      zipCode: '60601',
      description: 'Premium commercial spaces in the heart of downtown',
      ownerId: owner.id,
    },
  });

  console.log('✅ Properties created');

  // Create units
  const units = await Promise.all([
    prisma.unit.create({
      data: {
        unitNumber: 'A-101',
        type: UnitType.APARTMENT,
        status: UnitStatus.RENTED,
        floor: 1,
        area: 85,
        bedrooms: 2,
        bathrooms: 1,
        monthlyRent: 3500000,
        currency: Currency.IQD,
        propertyId: property1.id,
      },
    }),
    prisma.unit.create({
      data: {
        unitNumber: 'A-102',
        type: UnitType.APARTMENT,
        status: UnitStatus.AVAILABLE,
        floor: 1,
        area: 95,
        bedrooms: 3,
        bathrooms: 2,
        monthlyRent: 3200,
        currency: Currency.USD,
        propertyId: property1.id,
      },
    }),
    prisma.unit.create({
      data: {
        unitNumber: 'B-201',
        type: UnitType.APARTMENT,
        status: UnitStatus.RENTED,
        floor: 2,
        area: 120,
        bedrooms: 3,
        bathrooms: 2,
        monthlyRent: 4500,
        currency: Currency.USD,
        propertyId: property1.id,
      },
    }),
    prisma.unit.create({
      data: {
        unitNumber: 'OV-101',
        type: UnitType.APARTMENT,
        status: UnitStatus.RENTED,
        floor: 1,
        area: 110,
        bedrooms: 2,
        bathrooms: 2,
        monthlyRent: 3800,
        currency: Currency.USD,
        propertyId: property2.id,
      },
    }),
    prisma.unit.create({
      data: {
        unitNumber: 'OV-201',
        type: UnitType.APARTMENT,
        status: UnitStatus.AVAILABLE,
        floor: 2,
        area: 150,
        bedrooms: 4,
        bathrooms: 3,
        monthlyRent: 5500,
        currency: Currency.USD,
        propertyId: property2.id,
      },
    }),
    prisma.unit.create({
      data: {
        unitNumber: 'S-01',
        type: UnitType.SHOP,
        status: UnitStatus.RENTED,
        floor: 0,
        area: 200,
        monthlyRent: 8000,
        currency: Currency.USD,
        propertyId: property3.id,
      },
    }),
    prisma.unit.create({
      data: {
        unitNumber: 'OFF-301',
        type: UnitType.OFFICE,
        status: UnitStatus.MAINTENANCE,
        floor: 3,
        area: 180,
        monthlyRent: 6500,
        currency: Currency.USD,
        propertyId: property3.id,
      },
    }),
  ]);

  console.log('✅ Units created');

  // Create tenants
  const tenant1 = await prisma.tenant.create({
    data: {
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice@example.com',
      phone: '+1111222333',
      idType: 'Passport',
      idNumber: 'P12345678',
      nationality: 'US',
      address: '100 Oak Street, Boston, MA',
    },
  });

  const tenant2 = await prisma.tenant.create({
    data: {
      firstName: 'Bob',
      lastName: 'Williams',
      email: 'bob@example.com',
      phone: '+1444555666',
      idType: 'Driver License',
      idNumber: 'DL987654',
      nationality: 'US',
      address: '200 Pine Avenue, Seattle, WA',
    },
  });

  const tenant3 = await prisma.tenant.create({
    data: {
      firstName: 'Carlos',
      lastName: 'Garcia',
      email: 'carlos@example.com',
      phone: '+1777888999',
      idType: 'Passport',
      idNumber: 'P87654321',
      nationality: 'MX',
      address: '300 Elm Drive, Dallas, TX',
    },
  });

  const tenant4 = await prisma.tenant.create({
    data: {
      firstName: 'Diana',
      lastName: 'Lee',
      email: 'diana@example.com',
      phone: '+1222333444',
      idType: 'National ID',
      idNumber: 'NID456789',
      nationality: 'KR',
      address: '400 Maple Court, San Francisco, CA',
    },
  });

  console.log('✅ Tenants created');

  // Create leases
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const oneYearLater = new Date(now);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsLater = new Date(now);
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

  const lease1 = await prisma.lease.create({
    data: {
      leaseNumber: 'LSE-001-SEED',
      tenantId: tenant1.id,
      unitId: units[0].id,
      startDate: oneYearAgo,
      endDate: oneYearLater,
      rentAmount: 3500000,
      currency: Currency.IQD,
      securityDeposit: 5000,
      paymentFrequency: PaymentFrequency.MONTHLY,
      lateFeePercent: 5,
      lateFeeGraceDays: 5,
      status: 'ACTIVE',
    },
  });

  const lease2 = await prisma.lease.create({
    data: {
      leaseNumber: 'LSE-002-SEED',
      tenantId: tenant2.id,
      unitId: units[2].id,
      startDate: sixMonthsAgo,
      endDate: sixMonthsLater,
      rentAmount: 4500,
      currency: Currency.USD,
      securityDeposit: 9000,
      paymentFrequency: PaymentFrequency.MONTHLY,
      lateFeePercent: 5,
      lateFeeGraceDays: 3,
      status: 'ACTIVE',
    },
  });

  const lease3 = await prisma.lease.create({
    data: {
      leaseNumber: 'LSE-003-SEED',
      tenantId: tenant3.id,
      unitId: units[3].id,
      startDate: sixMonthsAgo,
      endDate: oneYearLater,
      rentAmount: 3800,
      currency: Currency.USD,
      securityDeposit: 7600,
      paymentFrequency: PaymentFrequency.MONTHLY,
      lateFeePercent: 3,
      lateFeeGraceDays: 7,
      status: 'ACTIVE',
    },
  });

  const lease4 = await prisma.lease.create({
    data: {
      leaseNumber: 'LSE-004-SEED',
      tenantId: tenant4.id,
      unitId: units[5].id,
      startDate: oneYearAgo,
      endDate: sixMonthsLater,
      rentAmount: 8000,
      currency: Currency.USD,
      securityDeposit: 16000,
      paymentFrequency: PaymentFrequency.MONTHLY,
      lateFeePercent: 5,
      lateFeeGraceDays: 5,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Leases created');

  // Create installments for each lease
  for (const lease of [lease1, lease2, lease3, lease4]) {
    const start = new Date(lease.startDate);
    const end = new Date(lease.endDate);
    let current = new Date(start);

    while (current < end) {
      const isPast = current < now;
      const isOverdue = isPast && Math.random() > 0.7;

      await prisma.installment.create({
        data: {
          leaseId: lease.id,
          dueDate: new Date(current),
          amount: lease.rentAmount,
          currency: lease.currency,
          paidAmount: isPast && !isOverdue ? lease.rentAmount : 0,
          status: isPast ? (isOverdue ? 'OVERDUE' : 'PAID') : 'PENDING',
        },
      });

      current.setMonth(current.getMonth() + 1);
    }
  }

  console.log('✅ Installments created');

  // Create payments
  const paidInstallments = await prisma.installment.findMany({
    where: { status: 'PAID' },
    include: { lease: true },
  });

  for (const inst of paidInstallments) {
    const methods: PaymentMethod[] = ['CASH', 'BANK_TRANSFER', 'DIGITAL_WALLET'];
    const method = methods[Math.floor(Math.random() * methods.length)];

    const payment = await prisma.payment.create({
      data: {
        paymentNumber: `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        leaseId: inst.leaseId,
        amount: inst.amount,
        currency: inst.currency,
        method,
        status: 'COMPLETED',
        paidDate: inst.dueDate,
        installmentId: inst.id,
      },
    });

    // Create receipt for a portion of payments
    if (Math.random() > 0.3) {
      await prisma.receipt.create({
        data: {
          receiptNumber: `RCT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          paymentId: payment.id,
        },
      });
    }
  }

  console.log('✅ Payments and receipts created');

    // Create notifications
    await prisma.notification.createMany({
      data: [
        {
          userId: owner.id,
          type: 'PAYMENT_DUE',
          title: 'الدفعة قيد الاستحقاق',
          message: 'دفعة الإيجار للوحدة A-101 مستحقة خلال 3 أيام',
        },
        {
          userId: owner.id,
          type: 'PAYMENT_OVERDUE',
          title: 'دفعة متأخرة',
          message: 'دفعة الإيجار للوحدة OV-101 متأخرة منذ 5 أيام',
        },
        {
          userId: owner.id,
          type: 'LEASE_EXPIRING',
          title: 'عقد يوشك على الانتهاء',
          message: 'عقد الإيجار LSE-004-SEED ينتهي خلال 30 يومًا',
        },
        {
          userId: admin.id,
          type: 'GENERAL',
          title: 'تحديث النظام',
          message: 'تم تحديث نظام سند إلى الإصدار 1.0',
          isRead: true,
        },
      ],
    });

    // Global Settings
    await prisma.systemSettings.create({
      data: {
        organizationName: 'سند للعقارات',
        defaultCurrency: 'IQD',
        exchangeRateUSD: 1460.0,
        language: 'ar',
      },
    });

  console.log('✅ Notifications created');
  console.log('🎉 Seed completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log('   Admin:      admin@rentflow.com / Admin@123');
  console.log('   Owner:      owner@rentflow.com / Owner@123');
  console.log('   Accountant: accountant@rentflow.com / Account@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
