import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationQueryDto } from '../common/dto/pagination.dto';
import {
  AdjustHarvestStockDto,
  CreateHarvestStockDto,
  HarvestStockQueryDto,
  UpdateHarvestStockDto,
} from './dto/harvest-stock.dto';

@Injectable()
export class HarvestStockService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: HarvestStockQueryDto & PaginationQueryDto) {
    const { skip, take } = paginate(query.page, query.limit);
    const where = {
      ...(query.cropId ? { cropId: query.cropId } : {}),
      ...(query.fieldId ? { fieldId: query.fieldId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.harvestStock.findMany({
        where,
        skip,
        take,
        include: { crop: true, field: true },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.harvestStock.count({ where }),
    ]);

    return { items, total, page: query.page ?? 1, limit: query.limit ?? 20 };
  }

  async findOne(id: string) {
    const stock = await this.prisma.harvestStock.findUnique({
      where: { id },
      include: { crop: true, field: true },
    });
    if (!stock) throw new NotFoundException('Harvest stock not found');
    return stock;
  }

  async create(dto: CreateHarvestStockDto) {
    await this.ensureReferencesExist(dto.cropId, dto.fieldId);

    const availableBalance = dto.availableBalance ?? dto.totalQuantity;
    if (availableBalance > dto.totalQuantity) {
      throw new BadRequestException(
        'Available balance cannot exceed total quantity',
      );
    }

    try {
      return await this.prisma.harvestStock.create({
        data: {
          cropId: dto.cropId,
          fieldId: dto.fieldId,
          totalQuantity: dto.totalQuantity,
          availableBalance,
          unit: dto.unit,
        },
        include: { crop: true, field: true },
      });
    } catch {
      throw new ConflictException(
        'Harvest stock already exists for this crop and field',
      );
    }
  }

  async update(id: string, dto: UpdateHarvestStockDto) {
    const existing = await this.findOne(id);

    if (dto.cropId || dto.fieldId) {
      await this.ensureReferencesExist(
        dto.cropId ?? existing.cropId,
        dto.fieldId ?? existing.fieldId,
      );
    }

    const totalQuantity = dto.totalQuantity ?? Number(existing.totalQuantity);
    const availableBalance =
      dto.availableBalance ?? Number(existing.availableBalance);

    if (availableBalance > totalQuantity) {
      throw new BadRequestException(
        'Available balance cannot exceed total quantity',
      );
    }

    return this.prisma.harvestStock.update({
      where: { id },
      data: dto,
      include: { crop: true, field: true },
    });
  }

  async adjust(id: string, dto: AdjustHarvestStockDto) {
    const existing = await this.findOne(id);
    const newBalance = Number(existing.availableBalance) + dto.adjustment;

    if (newBalance < 0) {
      throw new BadRequestException('Adjustment would result in negative balance');
    }

    if (newBalance > Number(existing.totalQuantity)) {
      throw new BadRequestException(
        'Adjustment would exceed total harvest quantity',
      );
    }

    return this.prisma.harvestStock.update({
      where: { id },
      data: { availableBalance: newBalance },
      include: { crop: true, field: true },
    });
  }

  private async ensureReferencesExist(cropId: string, fieldId: string) {
    const [crop, field] = await Promise.all([
      this.prisma.crop.findUnique({ where: { id: cropId } }),
      this.prisma.field.findUnique({ where: { id: fieldId } }),
    ]);
    if (!crop) throw new NotFoundException('Crop not found');
    if (!field) throw new NotFoundException('Field not found');
  }
}
