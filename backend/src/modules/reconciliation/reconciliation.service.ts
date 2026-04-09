import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { ImportStatementDto } from './dto/import-statement.dto';
import { Prisma, ReconciliationStatus, BankTxnType, JournalSourceType } from '@prisma/client';
import { JournalService } from '../journal/journal.service';

@Injectable()
export class ReconciliationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journalService: JournalService,
  ) {}

  async createBankAccount(dto: CreateBankAccountDto) {
    return this.prisma.bankAccount.create({
      data: {
        name: dto.name,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        currency: dto.currency || 'USD',
        glAccountId: dto.glAccountId,
      }
    });
  }

  async listBankAccounts() {
    const accounts = await this.prisma.bankAccount.findMany({
      include: {
        glAccount: {
          include: {
            balances: {
              orderBy: { fiscalPeriod: { endDate: 'desc' } },
              take: 1
            }
          }
        }
      }
    });

    return accounts.map((acc: any) => ({
      ...acc,
      currentBalance: acc.glAccount.balances[0]?.closingBalance || 0
    }));
  }

  async importStatement(dto: ImportStatementDto) {
    const bankAccount = await this.prisma.bankAccount.findUnique({
      where: { id: dto.bankAccountId }
    });
    if (!bankAccount) throw new NotFoundException('Bank account not found');

    const transactions = this.parseCsv(dto.csvString);

    return this.prisma.$transaction(async (tx) => {
      const statement = await tx.bankStatement.create({
        data: {
          bankAccountId: dto.bankAccountId,
          statementDate: new Date(dto.statementDate),
          openingBalance: new Prisma.Decimal(dto.openingBalance),
          closingBalance: new Prisma.Decimal(dto.closingBalance),
          status: ReconciliationStatus.PENDING,
          transactions: {
            create: transactions.map(t => ({
              transactionDate: new Date(t.date),
              description: t.description,
              reference: t.reference,
              amount: new Prisma.Decimal(t.amount),
              type: t.type as BankTxnType,
            }))
          }
        },
        include: { transactions: true }
      });

      await this.autoMatch(statement.id, tx);
      return tx.bankStatement.findUnique({
        where: { id: statement.id },
        include: { transactions: true }
      });
    });
  }

  async autoMatch(statementId: string, txArg?: any) {
    const tx = txArg || this.prisma;
    const statement = await tx.bankStatement.findUnique({
      where: { id: statementId },
      include: {
        bankAccount: true,
        transactions: { where: { matchedJournalLineId: null } }
      }
    });

    if (!statement) throw new NotFoundException('Statement not found');

    let matchedCount = 0;
    for (const txn of statement.transactions) {
      const dateStart = new Date(txn.transactionDate);
      dateStart.setDate(dateStart.getDate() - 3);
      const dateEnd = new Date(txn.transactionDate);
      dateEnd.setDate(dateEnd.getDate() + 3);

      const potentialMatches = await tx.journalLine.findMany({
        where: {
          accountId: statement.bankAccount.glAccountId,
          matchedBankTransaction: { is: null },
          journalEntry: {
            date: { gte: dateStart, lte: dateEnd }
          },
          OR: [
            { debit: txn.amount, credit: 0 },
            { credit: txn.amount, debit: 0 }
          ]
        },
        include: { journalEntry: true }
      });

      // Filter by type
      const exactMatches = potentialMatches.filter((m: any) => {
        const isDebit = new Prisma.Decimal(m.debit).equals(txn.amount);
        const isCredit = new Prisma.Decimal(m.credit).equals(txn.amount);
        return (txn.type === BankTxnType.DEBIT && isDebit) || (txn.type === BankTxnType.CREDIT && isCredit);
      });

      if (exactMatches.length === 1) {
        await tx.bankTransaction.update({
          where: { id: txn.id },
          data: {
            matchedJournalLineId: exactMatches[0].id,
            matchedAt: new Date()
          }
        });
        matchedCount++;
      }
    }

    if (matchedCount > 0) {
      await tx.bankStatement.update({
        where: { id: statementId },
        data: { status: ReconciliationStatus.IN_PROGRESS }
      });
    }

    const unmatchedCount = statement.transactions.length - matchedCount;
    return { matched: matchedCount, unmatched: unmatchedCount };
  }

  async manualMatch(transactionId: string, journalLineId: string, matchedById: string) {
    const txn = await this.prisma.bankTransaction.findUnique({ where: { id: transactionId } });
    if (!txn) throw new NotFoundException('Transaction not found');
    if (txn.matchedJournalLineId) throw new ConflictException('Transaction already matched');

    const line = await this.prisma.journalLine.findUnique({
      where: { id: journalLineId },
      include: { matchedBankTransaction: true }
    });
    if (!line) throw new NotFoundException('Journal line not found');
    if (line.matchedBankTransaction) throw new ConflictException('Journal line already matched');

    return this.prisma.bankTransaction.update({
      where: { id: transactionId },
      data: {
        matchedJournalLineId: journalLineId,
        matchedById,
        matchedAt: new Date()
      }
    });
  }

  async unmatch(transactionId: string) {
    return this.prisma.bankTransaction.update({
      where: { id: transactionId },
      data: {
        matchedJournalLineId: null,
        matchedById: null,
        matchedAt: null
      }
    });
  }

  async createJournalEntryFromTransaction(transactionId: string, dto: { description: string; accountId: string; sourceType?: string }, createdById: string) {
    const txn = await this.prisma.bankTransaction.findUnique({
      where: { id: transactionId },
      include: { bankStatement: { include: { bankAccount: true } } }
    });

    if (!txn) throw new NotFoundException('Transaction not found');
    if (txn.matchedJournalLineId) throw new ConflictException('Transaction already matched');

    const bankAccountId = txn.bankStatement.bankAccount.glAccountId;
    const lines = [];

    if (txn.type === BankTxnType.CREDIT) {
      // Cash DR / Revenue or something CR
      lines.push({ accountId: bankAccountId, debit: txn.amount.toNumber(), credit: 0 });
      lines.push({ accountId: dto.accountId, debit: 0, credit: txn.amount.toNumber() });
    } else {
      // Expense or something DR / Cash CR
      lines.push({ accountId: dto.accountId, debit: txn.amount.toNumber(), credit: 0 });
      lines.push({ accountId: bankAccountId, debit: 0, credit: txn.amount.toNumber() });
    }

    const entry = await this.journalService.createAndPost({
      date: txn.transactionDate,
      description: dto.description || txn.description,
      sourceType: (dto.sourceType as any) || JournalSourceType.ADJUSTMENT,
      lines,
    }, createdById);

    // Find the line that matches the bank side
    const matchedLine = entry.lines.find((l: any) => l.accountId === bankAccountId);

    return this.prisma.bankTransaction.update({
      where: { id: transactionId },
      data: {
        matchedJournalLineId: matchedLine.id,
        matchedAt: new Date(),
        matchedById: createdById,
        isManualEntry: true,
      }
    });
  }

  async completeReconciliation(statementId: string, completedById: string) {
    const statement = await this.prisma.bankStatement.findUnique({
      where: { id: statementId },
      include: { transactions: true }
    });

    if (!statement) throw new NotFoundException('Statement not found');

    const unmatched = statement.transactions.filter((t: any) => !t.matchedJournalLineId);
    if (unmatched.length > 0) {
      throw new BadRequestException(`${unmatched.length} unmatched transactions remain`);
    }

    let calculatedClosing = new Prisma.Decimal(statement.openingBalance);
    for (const t of statement.transactions) {
      if (t.type === BankTxnType.CREDIT) {
        calculatedClosing = calculatedClosing.add(t.amount);
      } else {
        calculatedClosing = calculatedClosing.sub(t.amount);
      }
    }

    const variance = calculatedClosing.sub(statement.closingBalance);

    if (!variance.equals(0)) {
      return { success: false, variance };
    }

    await this.prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        status: ReconciliationStatus.RECONCILED,
        reconciledAt: new Date(),
        reconciledById: completedById,
      }
    });

    return { success: true, variance: new Prisma.Decimal(0) };
  }

  async getStatementDetails(statementId: string) {
    return this.prisma.bankStatement.findUnique({
      where: { id: statementId },
      include: {
        transactions: {
          include: {
            matchedJournalLine: {
              include: { journalEntry: true }
            }
          }
        },
        bankAccount: true
      }
    });
  }

  async getSummary(bankAccountId: string) {
    const lastStatement = await this.prisma.bankStatement.findFirst({
      where: { bankAccountId, status: ReconciliationStatus.RECONCILED },
      orderBy: { statementDate: 'desc' }
    });

    const unmatchedCount = await this.prisma.bankTransaction.count({
      where: { bankStatement: { bankAccountId }, matchedJournalLineId: null }
    });

    const bankAccount = await this.prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
    if (!bankAccount) throw new NotFoundException('Bank account not found');

    const unreconciledJournalCount = await this.prisma.journalLine.count({
      where: {
        accountId: bankAccount.glAccountId,
        matchedBankTransaction: { is: null },
        journalEntry: { status: 'POSTED' }
      }
    });

    return {
      lastReconciledDate: lastStatement?.statementDate || null,
      lastStatementBalance: lastStatement?.closingBalance || 0,
      unreconciledJournalCount,
      unmatchedTransactionCount: unmatchedCount
    };
  }

  private parseCsv(csvString: string) {
    const lines = csvString.trim().split('\n');
    return lines.map(line => {
      const [date, description, reference, amount, type] = line.split(',').map(s => s.trim());
      return { date, description, reference, amount: parseFloat(amount), type };
    });
  }
}
