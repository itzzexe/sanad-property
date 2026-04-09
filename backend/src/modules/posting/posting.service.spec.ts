import { Test, TestingModule } from '@nestjs/testing';
import { PostingService } from './posting.service';
import { JournalService } from '../journal/journal.service';
import { AccountService } from '../account/account.service';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPaymentEntry, buildLeaseEntry } from './posting.rules';

describe('PostingService', () => {
  let service: PostingService;
  let journalService: any;
  let accountService: any;

  beforeEach(async () => {
    journalService = {
      findByReference: jest.fn(),
      createAndPost: jest.fn(),
    };

    accountService = {
      findAll: jest.fn().mockResolvedValue([
        { code: '1000', id: 'acc_1000' },
        { code: '1100', id: 'acc_1100' },
        { code: '2200', id: 'acc_2200' },
      ]),
    };

    const prisma = {
      installment: { findMany: jest.fn() },
      journalEntry: { findFirst: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostingService,
        { provide: JournalService, useValue: journalService },
        { provide: AccountService, useValue: accountService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PostingService>(PostingService);
  });

  it('handler does not create a second entry when reference exists', async () => {
    journalService.findByReference.mockResolvedValue({ id: 'existing_entry' });

    await service.handlePaymentCreated({
      paymentId: 'pay123',
      amount: 100,
      currency: 'USD',
      exchangeRate: 1,
      method: 'CASH',
    });

    expect(journalService.findByReference).toHaveBeenCalledWith('pay123');
    expect(journalService.createAndPost).not.toHaveBeenCalled();
  });

  it('payment.created handler creates Cash DR / AR CR with correct amounts', async () => {
    journalService.findByReference.mockResolvedValue(null);

    await service.handlePaymentCreated({
      paymentId: 'pay_new',
      amount: 1500,
      currency: 'USD',
      exchangeRate: 1,
      method: 'CASH',
    });

    expect(journalService.createAndPost).toHaveBeenCalled();
    const calledDto = journalService.createAndPost.mock.calls[0][0];
    expect(calledDto.reference).toBe('pay_new');
    expect(calledDto.lines[0].accountId).toBe('acc_1000');
    expect(calledDto.lines[0].debit).toBe(1500);
    expect(calledDto.lines[1].accountId).toBe('acc_1100');
    expect(calledDto.lines[1].credit).toBe(1500);
  });

  it('lease.created handler creates AR DR / Deferred Revenue CR', async () => {
    journalService.findByReference.mockResolvedValue(null);

    await service.handleLeaseCreated({
      leaseId: 'lease_123',
      totalRentAmount: 12000,
      currency: 'USD',
    });

    expect(journalService.createAndPost).toHaveBeenCalled();
    const calledDto = journalService.createAndPost.mock.calls[0][0];
    expect(calledDto.reference).toBe('lease_123');
    expect(calledDto.lines[0].accountId).toBe('acc_1100');
    expect(calledDto.lines[0].debit).toBe(12000);
    expect(calledDto.lines[1].accountId).toBe('acc_2200');
    expect(calledDto.lines[1].credit).toBe(12000);
  });

  it('Error in createAndPost: handler logs error and re-throws', async () => {
    journalService.findByReference.mockResolvedValue(null);
    journalService.createAndPost.mockRejectedValue(new Error('Simulated failure'));

    await expect(
      service.handlePaymentCreated({
        paymentId: 'pay_fail',
        amount: 500,
        currency: 'USD',
        exchangeRate: 1,
        method: 'CASH',
      })
    ).rejects.toThrow('Simulated failure');
  });
});
