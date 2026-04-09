import { Test, TestingModule } from '@nestjs/testing';
import { AccountService } from './account.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { AccountType } from '@prisma/client';

describe('AccountService', () => {
  let service: AccountService;
  let prisma: PrismaService;

  const mockPrismaService = {
    account: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('seed', () => {
    it('should upsert 22 accounts', async () => {
      await service.seed();
      expect(mockPrismaService.account.upsert).toHaveBeenCalledTimes(22);
    });
  });

  describe('create', () => {
    it('should create an account', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(null);
      mockPrismaService.account.create.mockResolvedValue({ id: '1', code: '1001' });

      const result = await service.create({
        code: '1001',
        name: 'Test',
        type: 'ASSET' as any,
      });

      expect(result.code).toBe('1001');
    });

    it('should throw ConflictException if code exists', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue({ id: '1' });
      await expect(service.create({ code: '1001', name: 'Test', type: 'ASSET' as any }))
        .rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if type mismatch with parent', async () => {
      mockPrismaService.account.findUnique
        .mockResolvedValueOnce(null) // for code uniqueness
        .mockResolvedValueOnce({ id: 'parent', type: 'LIABILITY' }); // for parent check

      await expect(service.create({ 
        code: '1001', 
        name: 'Test', 
        type: 'ASSET' as any, 
        parentId: 'parent' 
      })).rejects.toThrow(BadRequestException);
    });
  });

  describe('findTree', () => {
    it('should return nested structure', async () => {
      mockPrismaService.account.findMany.mockResolvedValue([
        { id: '1', code: '1000', parentId: null },
        { id: '2', code: '1001', parentId: '1' },
      ]);

      const tree = await service.findTree();
      expect(tree[0].children.length).toBe(1);
      expect(tree[0].children[0].id).toBe('2');
    });
  });

  describe('findByCode', () => {
    it('returns account', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue({ id: '1', code: '1000' });
      const result = await service.findByCode('1000');
      expect(result.id).toBe('1');
    });

    it('throws NotFoundException', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue(null);
      await expect(service.findByCode('9999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('throws for system account', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue({ id: '1', isSystem: true });
      await expect(service.delete('1')).rejects.toThrow(ConflictException);
    });

    it('throws for account with children', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue({ 
        id: '1', 
        isSystem: false, 
        children: [{ id: '2' }] 
      });
      await expect(service.delete('1')).rejects.toThrow(ConflictException);
    });
  });

  describe('suggestNextChildCode', () => {
    it('suggests next code based on last child', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue({
        id: 'parent',
        code: '1000',
        children: [{ code: '1002' }],
      });
      const next = await service.suggestNextChildCode('parent');
      expect(next).toBe('1003');
    });

    it('suggests parent code + 1 if no children', async () => {
      mockPrismaService.account.findUnique.mockResolvedValue({
        id: 'parent',
        code: '1000',
        children: [],
      });
      const next = await service.suggestNextChildCode('parent');
      expect(next).toBe('1001');
    });
  });
});
