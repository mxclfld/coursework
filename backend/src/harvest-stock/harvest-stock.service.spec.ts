import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HarvestStockService } from './harvest-stock.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HarvestStockService', () => {
  let service: HarvestStockService;

  const cropId = 'crop-1';
  const fieldId = 'field-1';

  const prisma = {
    harvestStock: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    crop: { findUnique: jest.fn() },
    field: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HarvestStockService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(HarvestStockService);
  });

  describe('findOne', () => {
    it('returns stock when it exists', async () => {
      const stock = { id: 'stock-1', cropId, fieldId, availableBalance: 100 };
      prisma.harvestStock.findUnique.mockResolvedValue(stock);

      await expect(service.findOne('stock-1')).resolves.toEqual(stock);
    });

    it('throws when stock is not found', async () => {
      prisma.harvestStock.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      cropId,
      fieldId,
      totalQuantity: 100,
      availableBalance: 80,
      unit: 'kg',
    };

    beforeEach(() => {
      prisma.crop.findUnique.mockResolvedValue({ id: cropId });
      prisma.field.findUnique.mockResolvedValue({ id: fieldId });
    });

    it('creates harvest stock when references exist', async () => {
      const created = { id: 'stock-1', ...createDto };
      prisma.harvestStock.create.mockResolvedValue(created);

      await expect(service.create(createDto)).resolves.toEqual(created);
    });

    it('throws when available balance exceeds total quantity', async () => {
      await expect(
        service.create({ ...createDto, availableBalance: 150 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when crop is not found', async () => {
      prisma.crop.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('throws conflict when stock already exists for crop and field', async () => {
      prisma.harvestStock.create.mockRejectedValue(new Error('unique violation'));

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('adjust', () => {
    const existing = {
      id: 'stock-1',
      cropId,
      fieldId,
      totalQuantity: 100,
      availableBalance: 50,
    };

    beforeEach(() => {
      prisma.harvestStock.findUnique.mockResolvedValue(existing);
    });

    it('applies a valid positive adjustment', async () => {
      const updated = { ...existing, availableBalance: 60 };
      prisma.harvestStock.update.mockResolvedValue(updated);

      await expect(
        service.adjust('stock-1', { adjustment: 10 }),
      ).resolves.toEqual(updated);

      expect(prisma.harvestStock.update).toHaveBeenCalledWith({
        where: { id: 'stock-1' },
        data: { availableBalance: 60 },
        include: { crop: true, field: true },
      });
    });

    it('throws when adjustment would make balance negative', async () => {
      await expect(
        service.adjust('stock-1', { adjustment: -60 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when adjustment would exceed total quantity', async () => {
      await expect(
        service.adjust('stock-1', { adjustment: 60 }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
