import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountService } from '../account/account.service';
import { FiscalPeriodService } from '../fiscal-period/fiscal-period.service';
import { BudgetStatus, JournalStatus, Prisma } from '@prisma/client';
import { parse } from 'csv-parse/sync';

@Injectable()
export class BudgetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountService: AccountService,
    private readonly fiscalPeriodService: FiscalPeriodService,
  ) {}

  async create(dto: { name: string; fiscalYearId: string; propertyId?: string; notes?: string }, createdById: string) {
    return this.prisma.budget.create({
      data: {
        name: dto.name,
        fiscalYearId: dto.fiscalYearId,
        propertyId: dto.propertyId,
        notes: dto.notes,
        status: BudgetStatus.DRAFT,
        createdById,
      },
    });
  }

  async upsertLines(budgetId: string, lines: any[]) {
    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
      include: { fiscalYear: { include: { periods: true } } },
    });
    if (!budget) throw new NotFoundException('Budget not found');
    if (budget.status === BudgetStatus.APPROVED) throw new ConflictException('Cannot modify an APPROVED budget');

    const accountsMap = new Map();
    for (const line of lines) {
      if (!accountsMap.has(line.accountId)) {
        const acc = await this.prisma.account.findUnique({ where: { id: line.accountId } });
        if (!acc) throw new NotFoundException(`Account ${line.accountId} not found`);
        if (!['REVENUE', 'EXPENSE'].includes(acc.type)) {
          throw new ConflictException(`Only REVENUE or EXPENSE accounts can be budgeted. Account ${acc.code} is ${acc.type}.`);
        }
        accountsMap.set(line.accountId, acc);
      }
    }

    const validPeriodIds = new Set(budget.fiscalYear.periods.map((p: any) => p.id));
    for (const line of lines) {
      if (!validPeriodIds.has(line.fiscalPeriodId)) {
        throw new ConflictException(`Fiscal period ${line.fiscalPeriodId} does not belong to budget's fiscal year`);
      }
    }

    await this.prisma.$transaction(async (tx) => {
      for (const line of lines) {
        await tx.budgetLine.upsert({
          where: {
            budgetId_accountId_fiscalPeriodId: {
              budgetId,
              accountId: line.accountId,
              fiscalPeriodId: line.fiscalPeriodId,
            },
          },
          update: {
            amount: line.amount,
            notes: line.notes,
          },
          create: {
            budgetId,
            accountId: line.accountId,
            fiscalPeriodId: line.fiscalPeriodId,
            amount: line.amount,
            notes: line.notes,
          },
        });
      }
    });

    return this.prisma.budgetLine.findMany({
      where: { budgetId },
      include: { account: true, fiscalPeriod: true },
    });
  }

  async importFromCsv(budgetId: string, csvString: string) {
    const records = parse(csvString, { columns: true, skip_empty_lines: true });
    
    const errors: string[] = [];
    const validLines: any[] = [];
    
    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
      include: { fiscalYear: { include: { periods: true } } },
    });
    if (!budget) throw new NotFoundException('Budget not found');

    for (let i = 0; i < records.length; i++) {
      const rec = records[i] as any;
      try {
        const account = await this.prisma.account.findUnique({ where: { code: rec.accountCode } });
        if (!account) {
          errors.push(`Row ${i + 1}: Account code ${rec.accountCode} not found`);
          continue;
        }

        const period = budget.fiscalYear.periods.find((p: any) => p.name === rec.periodName || p.periodNumber.toString() === rec.periodName);
        if (!period) {
          errors.push(`Row ${i + 1}: Fiscal period ${rec.periodName} not found in fiscal year`);
          continue;
        }

        const amount = parseFloat(rec.amount);
        if (isNaN(amount) || amount < 0) {
          errors.push(`Row ${i + 1}: Invalid amount ${rec.amount}`);
          continue;
        }

        validLines.push({
          accountId: account.id,
          fiscalPeriodId: period.id,
          amount,
          notes: rec.notes,
        });
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    if (validLines.length > 0) {
      await this.upsertLines(budgetId, validLines);
    }

    return {
      created: validLines.length,
      updated: validLines.length,
      errors,
    };
  }

  async approve(budgetId: string, approvedById: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
      include: { lines: true },
    });
    if (!budget) throw new NotFoundException('Budget not found');
    if (budget.createdById === approvedById) {
      throw new ConflictException('Creator cannot approve their own budget (four-eyes principle)');
    }
    if (budget.lines.length === 0) {
      throw new ConflictException('Cannot approve a budget with no lines');
    }

    return this.prisma.budget.update({
      where: { id: budgetId },
      data: {
        status: BudgetStatus.APPROVED,
        approvedById,
        approvedAt: new Date(),
      },
    });
  }

  async findAll(filters: { fiscalYearId?: string; propertyId?: string; status?: BudgetStatus }) {
    const where: Prisma.BudgetWhereInput = {};
    if (filters.fiscalYearId) where.fiscalYearId = filters.fiscalYearId;
    if (filters.propertyId) where.propertyId = filters.propertyId;
    if (filters.status) where.status = filters.status;

    const budgets = await this.prisma.budget.findMany({
      where,
      include: {
        _count: { select: { lines: true } },
        fiscalYear: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return budgets.map((b: any) => ({
      ...b,
      lineCount: b._count.lines,
      _count: undefined,
    }));
  }

  async findOne(id: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      include: {
        lines: {
          include: { account: true, fiscalPeriod: true },
        },
        fiscalYear: true,
      },
    });
    if (!budget) throw new NotFoundException('Budget not found');
    return budget;
  }

  async getVariance(budgetId: string) {
    const budget = await this.findOne(budgetId);

    let totalBudgeted = new Prisma.Decimal(0);
    let totalActual = new Prisma.Decimal(0);
    let totalVariance = new Prisma.Decimal(0);
    
    const lines = await Promise.all(budget.lines.map(async (line: any) => {
      const aggregations = await this.prisma.journalLine.aggregate({
        where: {
          accountId: line.accountId,
          journalEntry: {
            fiscalPeriodId: line.fiscalPeriodId,
            status: JournalStatus.POSTED,
          },
        },
        _sum: {
          baseCurrencyDebit: true,
          baseCurrencyCredit: true,
        },
      });

      const debitTotal = aggregations._sum.baseCurrencyDebit || new Prisma.Decimal(0);
      const creditTotal = aggregations._sum.baseCurrencyCredit || new Prisma.Decimal(0);

      let actual = new Prisma.Decimal(0);
      if (line.account.type === 'REVENUE') {
        actual = creditTotal.minus(debitTotal);
      } else if (line.account.type === 'EXPENSE') {
        actual = debitTotal.minus(creditTotal);
      }

      const variance = line.amount.minus(actual);
      const budgeted = Number(line.amount);
      const variancePct = budgeted > 0 ? (Number(variance) / budgeted) * 100 : 0;
      const isOverBudget = line.account.type === 'EXPENSE' && Number(actual) > budgeted;

      totalBudgeted = totalBudgeted.plus(line.amount);
      totalActual = totalActual.plus(actual);
      totalVariance = totalVariance.plus(variance);

      return {
        accountCode: line.account.code,
        accountName: line.account.name,
        periodName: line.fiscalPeriod.name,
        budgeted,
        actual: Number(actual),
        variance: Number(variance),
        variancePct,
        isOverBudget,
      };
    }));

    return {
      budgetId: budget.id,
      budgetName: budget.name,
      fiscalYear: budget.fiscalYear.name,
      totalBudgeted: Number(totalBudgeted),
      totalActual: Number(totalActual),
      totalVariance: Number(totalVariance),
      lines,
    };
  }

  async archive(id: string) {
    return this.prisma.budget.update({
      where: { id },
      data: { status: BudgetStatus.ARCHIVED },
    });
  }
}
