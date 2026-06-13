import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';
import {
  DashboardQueryDto,
  FinancialReportQueryDto,
  HarvestReportQueryDto,
  MachineryUsageReportQueryDto,
  PlantingReportQueryDto,
  PurchaseReportQueryDto,
  SalesReportQueryDto,
  WorkSummaryReportQueryDto,
} from './dto/report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  getPlantingsReport(query: PlantingReportQueryDto) {
    return this.prisma.planting.findMany({
      where: {
        ...(query.fieldId ? { fieldId: query.fieldId } : {}),
        ...(query.cropId ? { cropId: query.cropId } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.startDate || query.endDate
          ? {
              plantingDate: {
                ...(query.startDate ? { gte: query.startDate } : {}),
                ...(query.endDate ? { lte: query.endDate } : {}),
              },
            }
          : {}),
      },
      include: {
        field: true,
        crop: true,
        createdBy: { select: { id: true, fullName: true } },
      },
      orderBy: { plantingDate: 'desc' },
    });
  }

  getWorkSummaryReport(query: WorkSummaryReportQueryDto) {
    return this.prisma.workRecord.findMany({
      where: {
        ...(query.fieldId ? { fieldId: query.fieldId } : {}),
        ...(query.startDate || query.endDate
          ? {
              completionDate: {
                ...(query.startDate ? { gte: query.startDate } : {}),
                ...(query.endDate ? { lte: query.endDate } : {}),
              },
            }
          : {}),
      },
      include: {
        field: true,
        agriculturalWork: true,
        machinery: true,
        createdBy: { select: { id: true, fullName: true } },
      },
      orderBy: { completionDate: 'desc' },
    });
  }

  getMachineryUsageReport(query: MachineryUsageReportQueryDto) {
    return this.prisma.machineryUsage.findMany({
      where: {
        ...(query.machineryId ? { machineryId: query.machineryId } : {}),
        ...(query.startDate || query.endDate
          ? {
              usageDate: {
                ...(query.startDate ? { gte: query.startDate } : {}),
                ...(query.endDate ? { lte: query.endDate } : {}),
              },
            }
          : {}),
      },
      include: {
        machinery: true,
        workRecord: { include: { field: true, agriculturalWork: true } },
      },
      orderBy: { usageDate: 'desc' },
    });
  }

  getPurchasesReport(query: PurchaseReportQueryDto) {
    return this.prisma.fertilizerPurchase.findMany({
      where: {
        ...(query.supplierId ? { supplierId: query.supplierId } : {}),
        ...(query.startDate || query.endDate
          ? {
              purchaseDate: {
                ...(query.startDate ? { gte: query.startDate } : {}),
                ...(query.endDate ? { lte: query.endDate } : {}),
              },
            }
          : {}),
      },
      include: {
        supplier: true,
        fertilizer: true,
        createdBy: { select: { id: true, fullName: true } },
      },
      orderBy: { purchaseDate: 'desc' },
    });
  }

  getSalesReport(query: SalesReportQueryDto) {
    return this.prisma.sale.findMany({
      where: {
        ...(query.buyerId ? { buyerId: query.buyerId } : {}),
        ...(query.cropId ? { cropId: query.cropId } : {}),
        ...(query.startDate || query.endDate
          ? {
              saleDate: {
                ...(query.startDate ? { gte: query.startDate } : {}),
                ...(query.endDate ? { lte: query.endDate } : {}),
              },
            }
          : {}),
      },
      include: {
        buyer: true,
        crop: true,
        field: true,
        createdBy: { select: { id: true, fullName: true } },
      },
      orderBy: { saleDate: 'desc' },
    });
  }

  async getFinancialReport(query: FinancialReportQueryDto) {
    const dateFilter =
      query.startDate || query.endDate
        ? {
            ...(query.startDate ? { gte: query.startDate } : {}),
            ...(query.endDate ? { lte: query.endDate } : {}),
          }
        : undefined;

    const [sales, purchases] = await Promise.all([
      this.prisma.sale.findMany({
        where: dateFilter ? { saleDate: dateFilter } : {},
        select: { totalAmount: true, saleDate: true },
      }),
      this.prisma.fertilizerPurchase.findMany({
        where: dateFilter ? { purchaseDate: dateFilter } : {},
        select: { totalAmount: true, purchaseDate: true },
      }),
    ]);

    const totalRevenue = sales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount),
      0,
    );
    const totalCosts = purchases.reduce(
      (sum, purchase) => sum + Number(purchase.totalAmount),
      0,
    );

    return {
      totalRevenue,
      totalCosts,
      profit: totalRevenue - totalCosts,
      salesCount: sales.length,
      purchasesCount: purchases.length,
    };
  }

  getHarvestReport(query: HarvestReportQueryDto) {
    return this.prisma.harvestStock.findMany({
      where: {
        ...(query.cropId ? { cropId: query.cropId } : {}),
        ...(query.fieldId ? { fieldId: query.fieldId } : {}),
      },
      include: { crop: true, field: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getDashboard(user: AuthenticatedUser, query: DashboardQueryDto) {
    const dateFilter =
      query.startDate || query.endDate
        ? {
            ...(query.startDate ? { gte: query.startDate } : {}),
            ...(query.endDate ? { lte: query.endDate } : {}),
          }
        : undefined;

    const baseCounts = {
      fields: this.prisma.field.count(),
      crops: this.prisma.crop.count(),
      plantings: dateFilter
        ? this.prisma.planting.count({ where: { plantingDate: dateFilter } })
        : this.prisma.planting.count(),
      workRecords: dateFilter
        ? this.prisma.workRecord.count({ where: { completionDate: dateFilter } })
        : this.prisma.workRecord.count(),
      machinery: this.prisma.machinery.count(),
      sales: dateFilter
        ? this.prisma.sale.count({ where: { saleDate: dateFilter } })
        : this.prisma.sale.count(),
      purchases: dateFilter
        ? this.prisma.fertilizerPurchase.count({ where: { purchaseDate: dateFilter } })
        : this.prisma.fertilizerPurchase.count(),
      harvestStock: this.prisma.harvestStock.count(),
    };

    if (user.role === UserRole.AGRONOMIST) {
      const [fields, crops, plantings, workRecords, machinery, harvestStock] =
        await Promise.all([
          baseCounts.fields,
          baseCounts.crops,
          baseCounts.plantings,
          baseCounts.workRecords,
          baseCounts.machinery,
          baseCounts.harvestStock,
        ]);

      return {
        role: user.role,
        summary: { fields, crops, plantings, workRecords, machinery, harvestStock },
      };
    }

    if (user.role === UserRole.SALES_MANAGER) {
      const [suppliers, fertilizers, purchases, buyers, sales, harvestStock] =
        await Promise.all([
          this.prisma.supplier.count(),
          this.prisma.fertilizer.count(),
          baseCounts.purchases,
          this.prisma.buyer.count(),
          baseCounts.sales,
          baseCounts.harvestStock,
        ]);

      return {
        role: user.role,
        summary: { suppliers, fertilizers, purchases, buyers, sales, harvestStock },
      };
    }

    const [
      fields,
      crops,
      plantings,
      workRecords,
      machinery,
      suppliers,
      fertilizers,
      purchases,
      buyers,
      sales,
      harvestStock,
      financial,
    ] = await Promise.all([
      baseCounts.fields,
      baseCounts.crops,
      baseCounts.plantings,
      baseCounts.workRecords,
      baseCounts.machinery,
      this.prisma.supplier.count(),
      this.prisma.fertilizer.count(),
      baseCounts.purchases,
      this.prisma.buyer.count(),
      baseCounts.sales,
      baseCounts.harvestStock,
      this.getFinancialReport(query),
    ]);

    return {
      role: user.role,
      summary: {
        fields,
        crops,
        plantings,
        workRecords,
        machinery,
        suppliers,
        fertilizers,
        purchases,
        buyers,
        sales,
        harvestStock,
      },
      financial,
    };
  }
}
