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
import { FinanceExportModule } from './modules/finance-export/finance-export.module';
import { AttachmentModule } from './modules/attachment/attachment.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FiscalPeriodModule } from './modules/fiscal-period/fiscal-period.module';
import { AccountModule } from './modules/account/account.module';
import { PostingModule } from './modules/posting/posting.module';
import { TrialBalanceModule } from './modules/trial-balance/trial-balance.module';
import { BudgetModule } from './modules/budget/budget.module';
import { ArModule } from './modules/accounts-receivable/ar.module';
import { ApModule } from './modules/accounts-payable/ap.module';
import { FxModule } from './modules/fx/fx.module';
import { TaxModule } from './modules/tax/tax.module';
import { ReconciliationModule } from './modules/reconciliation/reconciliation.module';
import { JournalModule } from './modules/journal/journal.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
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
    FinanceExportModule,
    AttachmentModule,
    FiscalPeriodModule,
    AccountModule,
    PostingModule,
    TrialBalanceModule,
    BudgetModule,
    ArModule,
    ApModule,
    FxModule,
    TaxModule,
    ReconciliationModule,
    JournalModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
