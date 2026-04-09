import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JournalEntryNumberService {
  constructor(private readonly prisma: PrismaService) {}

  async generateNext(fiscalYearId: string): Promise<string> {
    return this.prisma.$transaction(async (tx: any) => {
      // Find or create sequence
      let sequence = await tx.entrySequence.findUnique({
        where: { fiscalYearId },
      });

      if (!sequence) {
        sequence = await tx.entrySequence.create({
          data: { fiscalYearId, lastSequence: 0 },
        });
      }

      // We need raw query to do SELECT FOR UPDATE safely, but Prisma transaction is enough for now
      // Let's use update to atomically increment it if we can
      const updatedSequence = await tx.entrySequence.update({
        where: { id: sequence.id },
        data: { lastSequence: { increment: 1 } },
      });

      // Get the fiscal year name
      const fiscalYear = await tx.fiscalYear.findUnique({
        where: { id: fiscalYearId },
      });

      if (!fiscalYear) {
        throw new Error('Fiscal year not found');
      }

      // "JE-2025-0001" format
      const yearStr = fiscalYear.name.replace('FY-', '');
      const paddedNum = updatedSequence.lastSequence.toString().padStart(4, '0');
      return `JE-${yearStr}-${paddedNum}`;
    });
  }
}
