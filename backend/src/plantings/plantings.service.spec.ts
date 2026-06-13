import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PlantingsService } from './plantings.service';
import { PrismaService } from '../prisma/prisma.service';
import { PlantingStatus, UserRole } from '../common/enums';

describe('PlantingsService', () => {
  let service: PlantingsService;

  const user = {
    id: 'user-1',
    username: 'agro1',
    role: UserRole.AGRONOMIST,
  };

  const fieldId = 'field-1';
  const cropId = 'crop-1';

  const createDto = {
    fieldId,
    cropId,
    plantingDate: new Date('2025-05-01'),
    plantedArea: 10,
    status: PlantingStatus.PLANNED,
  };

  const prisma = {
    planting: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    field: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    crop: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (callback) => callback(prisma));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlantingsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(PlantingsService);
  });

  describe('create', () => {
    it('creates planting and decrements field available area', async () => {
      prisma.field.findUnique.mockResolvedValue({
        id: fieldId,
        availableArea: 50,
      });
      prisma.crop.findUnique.mockResolvedValue({ id: cropId });

      const planting = { id: 'planting-1', ...createDto };
      prisma.planting.create.mockResolvedValue(planting);
      prisma.field.update.mockResolvedValue({});

      const result = await service.create(createDto, user);

      expect(result).toEqual(planting);
      expect(prisma.planting.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fieldId,
            cropId,
            plantedArea: 10,
            createdById: user.id,
          }),
        }),
      );
      expect(prisma.field.update).toHaveBeenCalledWith({
        where: { id: fieldId },
        data: { availableArea: { decrement: 10 } },
      });
    });

    it('throws when field is not found', async () => {
      prisma.field.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto, user)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when planted area exceeds available field area', async () => {
      prisma.field.findUnique.mockResolvedValue({
        id: fieldId,
        availableArea: 5,
      });
      prisma.crop.findUnique.mockResolvedValue({ id: cropId });

      await expect(service.create(createDto, user)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('deletes planting and restores field available area', async () => {
      const existing = {
        id: 'planting-1',
        fieldId,
        cropId,
        plantedArea: 15,
      };
      prisma.planting.findUnique.mockResolvedValue(existing);
      prisma.field.update.mockResolvedValue({});
      prisma.planting.delete.mockResolvedValue(existing);

      await expect(service.remove('planting-1')).resolves.toEqual(existing);

      expect(prisma.field.update).toHaveBeenCalledWith({
        where: { id: fieldId },
        data: { availableArea: { increment: 15 } },
      });
    });
  });

  describe('updateStatus', () => {
    it('updates planting status', async () => {
      const existing = { id: 'planting-1', status: PlantingStatus.PLANNED };
      const updated = { ...existing, status: PlantingStatus.COMPLETED };
      prisma.planting.findUnique.mockResolvedValue(existing);
      prisma.planting.update.mockResolvedValue(updated);

      await expect(
        service.updateStatus('planting-1', { status: PlantingStatus.COMPLETED }),
      ).resolves.toEqual(updated);
    });
  });
});
