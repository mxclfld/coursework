import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { paginate, PaginationQueryDto } from '../common/dto/pagination.dto';
import {
  CreateFertilizerPurchaseDto,
  FertilizerPurchaseQueryDto,
  UpdateFertilizerPurchaseDto,
  UpdatePaymentStatusDto,
} from './dto/fertilizer-purchase.dto';

@Injectable()
export class FertilizerPurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FertilizerPurchaseQueryDto & PaginationQueryDto) {
    const { skip, take } = paginate(query.page, query.limit);
    const where = {
      ...(query.supplierId ? { supplierId: query.supplierId } : {}),
      ...(query.fertilizerId ? { fertilizerId: query.fertilizerId } : {}),
      ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
      ...(query.startDate || query.endDate
        ? {
            purchaseDate: {
              ...(query.startDate ? { gte: query.startDate } : {}),
              ...(query.endDate ? { lte: query.endDate } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.fertilizerPurchase.findMany({
        where,
        skip,
        take,
        include: {
          supplier: true,
          fertilizer: true,
          createdBy: { select: { id: true, fullName: true } },
        },
        orderBy: { purchaseDate: 'desc' },
      }),
      this.prisma.fertilizerPurchase.count({ where }),
    ]);

    return { items, total, page: query.page ?? 1, limit: query.limit ?? 20 };
  }

  async findOne(id: string) {
    const purchase = await this.prisma.fertilizerPurchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        fertilizer: true,
        createdBy: { select: { id: true, fullName: true } },
      },
    });
    if (!purchase) throw new NotFoundException('Fertilizer purchase not found');
    return purchase;
  }

  async create(dto: CreateFertilizerPurchaseDto, user: AuthenticatedUser) {
    await this.ensureReferencesExist(dto.supplierId, dto.fertilizerId);
    const totalAmount = dto.quantity * dto.unitPrice;

    return this.prisma.fertilizerPurchase.create({
      data: {
        supplierId: dto.supplierId,
        fertilizerId: dto.fertilizerId,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        totalAmount,
        purchaseDate: dto.purchaseDate,
        paymentStatus: dto.paymentStatus,
        createdById: user.id,
      },
      include: { supplier: true, fertilizer: true },
    });
  }

  async update(id: string, dto: UpdateFertilizerPurchaseDto) {
    const existing = await this.findOne(id);
    if (dto.supplierId || dto.fertilizerId) {
      await this.ensureReferencesExist(
        dto.supplierId ?? existing.supplierId,
        dto.fertilizerId ?? existing.fertilizerId,
      );
    }

    const quantity = dto.quantity ?? Number(existing.quantity);
    const unitPrice = dto.unitPrice ?? Number(existing.unitPrice);
    const totalAmount = quantity * unitPrice;

    return this.prisma.fertilizerPurchase.update({
      where: { id },
      data: { ...dto, totalAmount },
      include: { supplier: true, fertilizer: true },
    });
  }

  async updatePaymentStatus(id: string, dto: UpdatePaymentStatusDto) {
    await this.findOne(id);
    return this.prisma.fertilizerPurchase.update({
      where: { id },
      data: { paymentStatus: dto.paymentStatus },
      include: { supplier: true, fertilizer: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.fertilizerPurchase.delete({ where: { id } });
  }

  private async ensureReferencesExist(supplierId: string, fertilizerId: string) {
    const [supplier, fertilizer] = await Promise.all([
      this.prisma.supplier.findUnique({ where: { id: supplierId } }),
      this.prisma.fertilizer.findUnique({ where: { id: fertilizerId } }),
    ]);
    if (!supplier) throw new NotFoundException('Supplier not found');
    if (!fertilizer) throw new NotFoundException('Fertilizer not found');
  }
}
