import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../common/enums';

describe('ReportsService', () => {
  let service: ReportsService;

  const prisma = {
    planting: { findMany: jest.fn(), count: jest.fn() },
    workRecord: { findMany: jest.fn(), count: jest.fn() },
    machineryUsage: { findMany: jest.fn() },
    fertilizerPurchase: { findMany: jest.fn(), count: jest.fn() },
    sale: { findMany: jest.fn(), count: jest.fn() },
    harvestStock: { findMany: jest.fn(), count: jest.fn() },
    field: { count: jest.fn() },
    crop: { count: jest.fn() },
    machinery: { count: jest.fn() },
    supplier: { count: jest.fn() },
    fertilizer: { count: jest.fn() },
    buyer: { count: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ReportsService);
  });

  describe('getFinancialReport', () => {
    it('calculates revenue, costs, and profit', async () => {
      prisma.sale.findMany.mockResolvedValue([
        { totalAmount: 1000, saleDate: new Date() },
        { totalAmount: 500, saleDate: new Date() },
      ]);
      prisma.fertilizerPurchase.findMany.mockResolvedValue([
        { totalAmount: 300, purchaseDate: new Date() },
        { totalAmount: 200, purchaseDate: new Date() },
      ]);

      await expect(service.getFinancialReport({})).resolves.toEqual({
        totalRevenue: 1500,
        totalCosts: 500,
        profit: 1000,
        salesCount: 2,
        purchasesCount: 2,
      });
    });

    it('applies date filters when provided', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');
      prisma.sale.findMany.mockResolvedValue([]);
      prisma.fertilizerPurchase.findMany.mockResolvedValue([]);

      await service.getFinancialReport({ startDate, endDate });

      expect(prisma.sale.findMany).toHaveBeenCalledWith({
        where: { saleDate: { gte: startDate, lte: endDate } },
        select: { totalAmount: true, saleDate: true },
      });
      expect(prisma.fertilizerPurchase.findMany).toHaveBeenCalledWith({
        where: { purchaseDate: { gte: startDate, lte: endDate } },
        select: { totalAmount: true, purchaseDate: true },
      });
    });
  });

  describe('getDashboard', () => {
    it('returns agronomist-specific summary', async () => {
      prisma.field.count.mockResolvedValue(5);
      prisma.crop.count.mockResolvedValue(3);
      prisma.planting.count.mockResolvedValue(10);
      prisma.workRecord.count.mockResolvedValue(20);
      prisma.machinery.count.mockResolvedValue(4);
      prisma.harvestStock.count.mockResolvedValue(7);

      const result = await service.getDashboard(
        { id: 'user-1', username: 'agro1', role: UserRole.AGRONOMIST },
        {},
      );

      expect(result).toEqual({
        role: UserRole.AGRONOMIST,
        summary: {
          fields: 5,
          crops: 3,
          plantings: 10,
          workRecords: 20,
          machinery: 4,
          harvestStock: 7,
        },
      });
    });

    it('returns sales manager-specific summary', async () => {
      prisma.supplier.count.mockResolvedValue(2);
      prisma.fertilizer.count.mockResolvedValue(6);
      prisma.fertilizerPurchase.count.mockResolvedValue(8);
      prisma.buyer.count.mockResolvedValue(4);
      prisma.sale.count.mockResolvedValue(12);
      prisma.harvestStock.count.mockResolvedValue(7);

      const result = await service.getDashboard(
        { id: 'user-2', username: 'sales1', role: UserRole.SALES_MANAGER },
        {},
      );

      expect(result).toEqual({
        role: UserRole.SALES_MANAGER,
        summary: {
          suppliers: 2,
          fertilizers: 6,
          purchases: 8,
          buyers: 4,
          sales: 12,
          harvestStock: 7,
        },
      });
    });

    it('returns farm manager summary with financial data', async () => {
      prisma.field.count.mockResolvedValue(5);
      prisma.crop.count.mockResolvedValue(3);
      prisma.planting.count.mockResolvedValue(10);
      prisma.workRecord.count.mockResolvedValue(20);
      prisma.machinery.count.mockResolvedValue(4);
      prisma.supplier.count.mockResolvedValue(2);
      prisma.fertilizer.count.mockResolvedValue(6);
      prisma.fertilizerPurchase.count.mockResolvedValue(8);
      prisma.buyer.count.mockResolvedValue(4);
      prisma.sale.count.mockResolvedValue(12);
      prisma.harvestStock.count.mockResolvedValue(7);
      prisma.sale.findMany.mockResolvedValue([{ totalAmount: 1000, saleDate: new Date() }]);
      prisma.fertilizerPurchase.findMany.mockResolvedValue([
        { totalAmount: 400, purchaseDate: new Date() },
      ]);

      const result = await service.getDashboard(
        { id: 'user-3', username: 'manager1', role: UserRole.FARM_MANAGER },
        {},
      );

      expect(result.role).toBe(UserRole.FARM_MANAGER);
      expect(result.summary).toEqual({
        fields: 5,
        crops: 3,
        plantings: 10,
        workRecords: 20,
        machinery: 4,
        suppliers: 2,
        fertilizers: 6,
        purchases: 8,
        buyers: 4,
        sales: 12,
        harvestStock: 7,
      });
      expect(result.financial).toEqual({
        totalRevenue: 1000,
        totalCosts: 400,
        profit: 600,
        salesCount: 1,
        purchasesCount: 1,
      });
    });
  });

  describe('getSalesReport', () => {
    it('queries sales with optional buyer filter', async () => {
      const sales = [{ id: 'sale-1' }];
      prisma.sale.findMany.mockResolvedValue(sales);

      await expect(
        service.getSalesReport({ buyerId: 'buyer-1' }),
      ).resolves.toEqual(sales);

      expect(prisma.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { buyerId: 'buyer-1' },
        }),
      );
    });
  });
});
