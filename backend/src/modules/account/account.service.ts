import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Account, AccountType } from '@prisma/client';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountService {
  private readonly systemAccounts = [
    { code: '1000', name: 'Cash', type: 'ASSET' as AccountType, subtype: 'CURRENT_ASSET' },
    { code: '1100', name: 'Accounts Receivable', type: 'ASSET' as AccountType, subtype: 'CURRENT_ASSET' },
    { code: '1200', name: 'Prepaid Rent', type: 'ASSET' as AccountType, subtype: 'CURRENT_ASSET' },
    { code: '1500', name: 'Security Deposit Asset', type: 'ASSET' as AccountType, subtype: 'CURRENT_ASSET' },
    { code: '2000', name: 'Accounts Payable', type: 'LIABILITY' as AccountType, subtype: 'CURRENT_LIABILITY' },
    { code: '2100', name: 'Security Deposits Held', type: 'LIABILITY' as AccountType, subtype: 'CURRENT_LIABILITY' },
    { code: '2200', name: 'Deferred Revenue', type: 'LIABILITY' as AccountType, subtype: 'CURRENT_LIABILITY' },
    { code: '2300', name: 'Tax Payable', type: 'LIABILITY' as AccountType, subtype: 'CURRENT_LIABILITY' },
    { code: '2400', name: 'Accrued Expenses', type: 'LIABILITY' as AccountType, subtype: 'CURRENT_LIABILITY' },
    { code: '3000', name: 'Owner Equity', type: 'EQUITY' as AccountType, subtype: null },
    { code: '3100', name: 'Retained Earnings', type: 'EQUITY' as AccountType, subtype: null },
    { code: '3200', name: 'Drawings', type: 'EQUITY' as AccountType, subtype: null },
    { code: '4000', name: 'Rental Revenue', type: 'REVENUE' as AccountType, subtype: 'OPERATING_REVENUE' },
    { code: '4100', name: 'Late Fee Revenue', type: 'REVENUE' as AccountType, subtype: 'OPERATING_REVENUE' },
    { code: '4200', name: 'Other Revenue', type: 'REVENUE' as AccountType, subtype: 'OTHER_REVENUE' },
    { code: '4900', name: 'Bad Debt Recovered', type: 'REVENUE' as AccountType, subtype: 'OTHER_REVENUE' },
    { code: '5000', name: 'Maintenance Expense', type: 'EXPENSE' as AccountType, subtype: 'OPERATING_EXPENSE' },
    { code: '5100', name: 'Management Fee Expense', type: 'EXPENSE' as AccountType, subtype: 'OPERATING_EXPENSE' },
    { code: '5200', name: 'Utilities Expense', type: 'EXPENSE' as AccountType, subtype: 'OPERATING_EXPENSE' },
    { code: '5300', name: 'Insurance Expense', type: 'EXPENSE' as AccountType, subtype: 'OPERATING_EXPENSE' },
    { code: '5400', name: 'Bad Debt Expense', type: 'EXPENSE' as AccountType, subtype: 'OPERATING_EXPENSE' },
    { code: '5900', name: 'FX Gain/Loss', type: 'EXPENSE' as AccountType, subtype: 'OTHER_EXPENSE' },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async seed() {
    console.log('🌱 Seeding system accounts...');
    for (const sysAcc of this.systemAccounts) {
      await this.prisma.account.upsert({
        where: { code: sysAcc.code },
        update: {
          name: sysAcc.name,
          type: sysAcc.type,
          subtype: sysAcc.subtype,
          isSystem: true,
        },
        create: {
          code: sysAcc.code,
          name: sysAcc.name,
          type: sysAcc.type,
          subtype: sysAcc.subtype,
          isSystem: true,
        },
      });
    }
    console.log('✅ System accounts seeded.');
  }

  async create(dto: CreateAccountDto): Promise<Account> {
    // Unique code validation
    const existing = await this.prisma.account.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException('Account code already exists');

    // Parent validation
    if (dto.parentId) {
      const parent = await this.prisma.account.findUnique({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException('Parent account not found');
      if (parent.type !== dto.type) {
        throw new BadRequestException('Child account type must match parent type');
      }
    }

    return this.prisma.account.create({
      data: dto as any,
    });
  }

  async findAll(filters?: {
    type?: AccountType;
    isActive?: boolean;
    parentId?: string | null;
  }): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: {
        ...filters,
        parentId: filters?.parentId === undefined ? undefined : filters.parentId,
      },
      orderBy: { code: 'asc' },
    });
  }

  async findTree(): Promise<any[]> {
    const allAccounts = await this.prisma.account.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });

    const buildTree = (parentId: string | null): any[] => {
      return allAccounts
        .filter((a: any) => a.parentId === parentId)
        .map((a: any) => ({
          ...a,
          children: buildTree(a.id),
        }));
    };

    return buildTree(null);
  }

  async findOne(id: string): Promise<Account> {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: { children: true, parent: true },
    });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async findByCode(code: string): Promise<Account> {
    const account = await this.prisma.account.findUnique({
      where: { code },
    });
    if (!account) throw new NotFoundException(`Account with code ${code} not found`);
    return account;
  }

  async update(id: string, dto: UpdateAccountDto): Promise<Account> {
    const account = await this.findOne(id);

    if (account.isSystem && (dto as any).code) {
      throw new ConflictException('Cannot change the code of a system account');
    }

    return this.prisma.account.update({
      where: { id },
      data: dto as any,
    });
  }

  async deactivate(id: string): Promise<Account> {
    return this.prisma.account.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async delete(id: string): Promise<void> {
    const account = await this.findOne(id);

    if (account.isSystem) {
      throw new ConflictException('System accounts cannot be deleted');
    }

    const journalLinesCount = await this.prisma.journalLine.count({ where: { accountId: id } });
    if (journalLinesCount > 0) throw new ConflictException('Cannot delete account referenced by journal entries');

    if ((account as any).children && (account as any).children.length > 0) {
      throw new ConflictException('Cannot delete account that has sub-accounts');
    }

    await this.prisma.account.delete({ where: { id } });
  }

  async suggestNextChildCode(parentId: string): Promise<string> {
    const parent = await this.prisma.account.findUnique({
      where: { id: parentId },
      include: { children: { orderBy: { code: 'desc' }, take: 1 } },
    });
    if (!parent) throw new NotFoundException('Parent account not found');

    if (!parent.children || parent.children.length === 0) {
      return (parseInt(parent.code) + 1).toString();
    }

    const lastChildCode = parent.children[0].code;
    return (parseInt(lastChildCode) + 1).toString();
  }

  async getLedger(
    accountId: string,
    filters: { startDate?: string; endDate?: string; fiscalPeriodId?: string },
  ): Promise<any> {
    const account = await this.prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Account not found');

    const whereEntry: any = { status: 'POSTED' };
    if (filters.startDate) whereEntry.date = { ...whereEntry.date, gte: new Date(filters.startDate) };
    if (filters.endDate) whereEntry.date = { ...whereEntry.date, lte: new Date(filters.endDate) };
    if (filters.fiscalPeriodId) whereEntry.fiscalPeriodId = filters.fiscalPeriodId;

    const journalLines = await this.prisma.journalLine.findMany({
      where: {
        accountId,
        journalEntry: whereEntry,
      },
      include: {
        journalEntry: true,
      },
      orderBy: {
        journalEntry: {
          date: 'asc',
        },
      },
    });

    let runningBalance = 0;
    const computedLines = journalLines.map((line: any) => {
      const db = Number(line.baseCurrencyDebit);
      const cr = Number(line.baseCurrencyCredit);
      const diff = db - cr;
      runningBalance += diff;
      return {
        ...line,
        runningBalance,
      };
    });

    return {
      account,
      lines: computedLines,
      runningBalance,
    };
  }
}
