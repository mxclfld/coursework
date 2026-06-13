import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { paginate, PaginationQueryDto } from '../common/dto/pagination.dto';
import { CreateSaleDto, SaleQueryDto, UpdateSaleDto } from './dto/sale.dto';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: SaleQueryDto & PaginationQueryDto) {
    const { skip, take } = paginate(query.page, query.limit);
    const where = {
      ...(query.buyerId ? { buyerId: query.buyerId } : {}),
      ...(query.cropId ? { cropId: query.cropId } : {}),
      ...(query.fieldId ? { fieldId: query.fieldId } : {}),
      ...(query.startDate || query.endDate
        ? {
            saleDate: {
              ...(query.startDate ? { gte: query.startDate } : {}),
              ...(query.endDate ? { lte: query.endDate } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip,
        take,
        include: {
          buyer: true,
          crop: true,
          field: true,
          createdBy: { select: { id: true, fullName: true } },
        },
        orderBy: { saleDate: 'desc' },
      }),
      this.prisma.sale.count({ where }),
    ]);

    return { items, total, page: query.page ?? 1, limit: query.limit ?? 20 };
  }

  async findOne(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        buyer: true,
        crop: true,
        field: true,
        createdBy: { select: { id: true, fullName: true } },
      },
    });
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }

  async create(dto: CreateSaleDto, user: AuthenticatedUser) {
    await this.ensureReferencesExist(dto.buyerId, dto.cropId, dto.fieldId);

    const stock = await this.prisma.harvestStock.findUnique({
      where: {
        cropId_fieldId: { cropId: dto.cropId, fieldId: dto.fieldId },
      },
    });

    if (!stock) {
      throw new BadRequestException(
        'No harvest stock found for this crop and field',
      );
    }

    if (Number(dto.quantitySold) > Number(stock.availableBalance)) {
      throw new BadRequestException(
        'Quantity sold exceeds available harvest stock balance',
      );
    }

    const totalAmount = dto.quantitySold * dto.unitPrice;

    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          buyerId: dto.buyerId,
          cropId: dto.cropId,
          fieldId: dto.fieldId,
          quantitySold: dto.quantitySold,
          unitPrice: dto.unitPrice,
          totalAmount,
          saleDate: dto.saleDate,
          createdById: user.id,
        },
        include: { buyer: true, crop: true, field: true },
      });

      await tx.harvestStock.update({
        where: { id: stock.id },
        data: { availableBalance: { decrement: dto.quantitySold } },
      });

      return sale;
    });
  }

  async update(id: string, dto: UpdateSaleDto) {
    const existing = await this.findOne(id);

    if (dto.buyerId || dto.cropId || dto.fieldId) {
      await this.ensureReferencesExist(
        dto.buyerId ?? existing.buyerId,
        dto.cropId ?? existing.cropId,
        dto.fieldId ?? existing.fieldId,
      );
    }

    const quantitySold = dto.quantitySold ?? Number(existing.quantitySold);
    const unitPrice = dto.unitPrice ?? Number(existing.unitPrice);
    const quantityDiff = quantitySold - Number(existing.quantitySold);

    if (quantityDiff !== 0) {
      const cropId = dto.cropId ?? existing.cropId;
      const fieldId = dto.fieldId ?? existing.fieldId;
      const stock = await this.prisma.harvestStock.findUnique({
        where: { cropId_fieldId: { cropId, fieldId } },
      });

      if (!stock) {
        throw new BadRequestException('No harvest stock found for this crop and field');
      }

      if (quantityDiff > Number(stock.availableBalance)) {
        throw new BadRequestException(
          'Quantity increase exceeds available harvest stock balance',
        );
      }
    }

    const totalAmount = quantitySold * unitPrice;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.sale.update({
        where: { id },
        data: { ...dto, totalAmount },
        include: { buyer: true, crop: true, field: true },
      });

      if (quantityDiff !== 0) {
        const cropId = dto.cropId ?? existing.cropId;
        const fieldId = dto.fieldId ?? existing.fieldId;
        await tx.harvestStock.update({
          where: { cropId_fieldId: { cropId, fieldId } },
          data: { availableBalance: { decrement: quantityDiff } },
        });
      }

      return updated;
    });
  }

  async remove(id: string) {
    const existing = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.harvestStock.update({
        where: {
          cropId_fieldId: {
            cropId: existing.cropId,
            fieldId: existing.fieldId,
          },
        },
        data: { availableBalance: { increment: existing.quantitySold } },
      });

      return tx.sale.delete({ where: { id } });
    });
  }

  private async ensureReferencesExist(
    buyerId: string,
    cropId: string,
    fieldId: string,
  ) {
    const [buyer, crop, field] = await Promise.all([
      this.prisma.buyer.findUnique({ where: { id: buyerId } }),
      this.prisma.crop.findUnique({ where: { id: cropId } }),
      this.prisma.field.findUnique({ where: { id: fieldId } }),
    ]);

    if (!buyer) throw new NotFoundException('Buyer not found');
    if (!crop) throw new NotFoundException('Crop not found');
    if (!field) throw new NotFoundException('Field not found');
  }
}
