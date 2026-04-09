import { Controller, Get, Post, Body, Param, UseGuards, Request, Delete } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { ImportStatementDto } from './dto/import-statement.dto';
import { MatchTransactionDto } from './dto/match-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reconciliation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReconciliationController {
  constructor(private readonly service: ReconciliationService) {}

  @Get('bank-accounts')
  @Roles('ADMIN', 'ACCOUNTANT')
  listBankAccounts() {
    return this.service.listBankAccounts();
  }

  @Post('bank-accounts')
  @Roles('ADMIN')
  createBankAccount(@Body() dto: CreateBankAccountDto) {
    return this.service.createBankAccount(dto);
  }

  @Get('bank-accounts/:id/summary')
  @Roles('ADMIN', 'ACCOUNTANT')
  getSummary(@Param('id') id: string) {
    return this.service.getSummary(id);
  }

  @Post('bank-statements/import')
  @Roles('ADMIN', 'ACCOUNTANT')
  importStatement(@Body() dto: ImportStatementDto) {
    return this.service.importStatement(dto);
  }

  @Get('bank-statements/:id')
  @Roles('ADMIN', 'ACCOUNTANT')
  getStatement(@Param('id') id: string) {
    return this.service.getStatementDetails(id);
  }

  @Post('bank-statements/:id/auto-match')
  @Roles('ADMIN', 'ACCOUNTANT')
  autoMatch(@Param('id') id: string) {
    return this.service.autoMatch(id);
  }

  @Post('bank-statements/:id/complete')
  @Roles('ADMIN', 'ACCOUNTANT')
  complete(@Param('id') id: string, @Request() req: any) {
    return this.service.completeReconciliation(id, req.user.id);
  }

  @Post('match')
  @Roles('ADMIN', 'ACCOUNTANT')
  manualMatch(@Body() dto: MatchTransactionDto, @Request() req: any) {
    return this.service.manualMatch(dto.transactionId, dto.journalLineId, req.user.id);
  }

  @Post('unmatch/:transactionId')
  @Roles('ADMIN', 'ACCOUNTANT')
  unmatch(@Param('transactionId') transactionId: string) {
    return this.service.unmatch(transactionId);
  }

  @Post('create-entry/:transactionId')
  @Roles('ADMIN', 'ACCOUNTANT')
  createEntry(
    @Param('transactionId') transactionId: string,
    @Body() dto: { description: string; accountId: string; sourceType?: string },
    @Request() req: any
  ) {
    return this.service.createJournalEntryFromTransaction(transactionId, dto, req.user.id);
  }
}
