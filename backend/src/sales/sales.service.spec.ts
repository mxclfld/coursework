import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../common/enums';

describe('SalesService', () => {
  let service: SalesService;

  const user = {
    id: 'user-1',
    username: 'sales1',
    role: UserRole.SALES_MANAGER,
  };

  const buyerId = 'buyer-1';
  const cropId = 'crop-1';
  const fieldId = 'field-1';

  const createDto = {
    buyerId,
    cropId,
    fieldId,
    quantitySold: 50,
    unitPrice: 10,
    saleDate: new Date('2025-06-01'),
  };

  const prisma = {
    sale: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    buyer: { findUnique: jest.fn() },
    crop: { findUnique: jest.fn() },
    field: { findUnique: jest.fn() },
    harvestStock: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (callback) => callback(prisma));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(SalesService);
  });

  describe('findOne', () => {
    it('returns a sale when it exists', async () => {
      const sale = { id: 'sale-1', buyerId, cropId, fieldId, quantitySold: 50 };
      prisma.sale.findUnique.mockResolvedValue(sale);

      await expect(service.findOne('sale-1')).resolves.toEqual(sale);
    });

    it('throws when sale is not found', async () => {
      prisma.sale.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    beforeEach(() => {
      prisma.buyer.findUnique.mockResolvedValue({ id: buyerId });
      prisma.crop.findUnique.mockResolvedValue({ id: cropId });
      prisma.field.findUnique.mockResolvedValue({ id: fieldId });
    });

    it('creates a sale and decrements harvest stock', async () => {
      const stock = {
        id: 'stock-1',
        cropId,
        fieldId,
        availableBalance: 100,
      };
      const createdSale = {
        id: 'sale-1',
        ...createDto,
        totalAmount: 500,
      };

      prisma.harvestStock.findUnique.mockResolvedValue(stock);
      prisma.sale.create.mockResolvedValue(createdSale);
      prisma.harvestStock.update.mockResolvedValue({});

      const result = await service.create(createDto, user);

      expect(result).toEqual(createdSale);
      expect(prisma.sale.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            buyerId,
            cropId,
            fieldId,
            quantitySold: 50,
            unitPrice: 10,
            totalAmount: 500,
            createdById: user.id,
          }),
        }),
      );
      expect(prisma.harvestStock.update).toHaveBeenCalledWith({
        where: { id: stock.id },
        data: { availableBalance: { decrement: 50 } },
      });
    });

    it('throws when harvest stock does not exist', async () => {
      prisma.harvestStock.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto, user)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws when quantity exceeds available stock', async () => {
      prisma.harvestStock.findUnique.mockResolvedValue({
        id: 'stock-1',
        availableBalance: 10,
      });

      await expect(service.create(createDto, user)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws when buyer is not found', async () => {
      prisma.buyer.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto, user)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deletes a sale and restores harvest stock balance', async () => {
      const existing = {
        id: 'sale-1',
        buyerId,
        cropId,
        fieldId,
        quantitySold: 30,
      };
      prisma.sale.findUnique.mockResolvedValue(existing);
      prisma.harvestStock.update.mockResolvedValue({});
      prisma.sale.delete.mockResolvedValue(existing);

      await expect(service.remove('sale-1')).resolves.toEqual(existing);

      expect(prisma.harvestStock.update).toHaveBeenCalledWith({
        where: { cropId_fieldId: { cropId, fieldId } },
        data: { availableBalance: { increment: 30 } },
      });
      expect(prisma.sale.delete).toHaveBeenCalledWith({ where: { id: 'sale-1' } });
    });
  });
});
