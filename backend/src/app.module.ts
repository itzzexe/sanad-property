import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { PropertyModule } from './modules/property/property.module';
import { UnitModule } from './modules/unit/unit.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { LeaseModule } from './modules/lease/lease.module';
import { PaymentModule } from './modules/payment/payment.module';
import { InstallmentModule } from './modules/installment/installment.module';
import { ReceiptModule } from './modules/receipt/receipt.module';
import { NotificationModule } from './modules/notification/notification.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UploadModule } from './modules/upload/upload.module';
import { AuditModule } from './modules/audit/audit.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UserModule } from './modules/user/user.module';
import { ConfigModule } from '@nestjs/config';
import { FinancialModule } from './modules/financial/financial.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    PropertyModule,
    UnitModule,
    TenantModule,
    LeaseModule,
    PaymentModule,
    InstallmentModule,
    ReceiptModule,
    NotificationModule,
    DashboardModule,
    UploadModule,
    AuditModule,
    SettingsModule,
    UserModule,
    FinancialModule,
    ReportsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
