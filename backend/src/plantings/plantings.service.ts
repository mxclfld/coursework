import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { paginate, PaginationQueryDto } from '../common/dto/pagination.dto';
import {
  CreatePlantingDto,
  PlantingQueryDto,
  UpdatePlantingDto,
  UpdatePlantingStatusDto,
} from './dto/planting.dto';

@Injectable()
export class PlantingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PlantingQueryDto & PaginationQueryDto) {
    const { skip, take } = paginate(query.page, query.limit);
    const where = {
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
    };

    const [items, total] = await Promise.all([
      this.prisma.planting.findMany({
        where,
        skip,
        take,
        include: {
          field: true,
          crop: true,
          createdBy: { select: { id: true, fullName: true } },
        },
        orderBy: { plantingDate: 'desc' },
      }),
      this.prisma.planting.count({ where }),
    ]);

    return { items, total, page: query.page ?? 1, limit: query.limit ?? 20 };
  }

  async findOne(id: string) {
    const planting = await this.prisma.planting.findUnique({
      where: { id },
      include: {
        field: true,
        crop: true,
        createdBy: { select: { id: true, fullName: true } },
      },
    });
    if (!planting) throw new NotFoundException('Planting not found');
    return planting;
  }

  async create(dto: CreatePlantingDto, user: AuthenticatedUser) {
    const field = await this.prisma.field.findUnique({ where: { id: dto.fieldId } });
    if (!field) throw new NotFoundException('Field not found');

    const crop = await this.prisma.crop.findUnique({ where: { id: dto.cropId } });
    if (!crop) throw new NotFoundException('Crop not found');

    if (Number(dto.plantedArea) > Number(field.availableArea)) {
      throw new BadRequestException(
        'Planted area cannot exceed field available area',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const planting = await tx.planting.create({
        data: {
          fieldId: dto.fieldId,
          cropId: dto.cropId,
          plantingDate: dto.plantingDate,
          plantedArea: dto.plantedArea,
          status: dto.status,
          createdById: user.id,
        },
        include: { field: true, crop: true },
      });

      await tx.field.update({
        where: { id: dto.fieldId },
        data: {
          availableArea: {
            decrement: dto.plantedArea,
          },
        },
      });

      return planting;
    });
  }

  async update(id: string, dto: UpdatePlantingDto) {
    const existing = await this.findOne(id);

    if (dto.plantedArea !== undefined) {
      const field = await this.prisma.field.findUnique({
        where: { id: dto.fieldId ?? existing.fieldId },
      });
      if (!field) throw new NotFoundException('Field not found');

      const areaDiff = dto.plantedArea - Number(existing.plantedArea);
      if (areaDiff > Number(field.availableArea)) {
        throw new BadRequestException(
          'Planted area increase exceeds available field area',
        );
      }

      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.planting.update({
          where: { id },
          data: dto,
          include: { field: true, crop: true },
        });

        if (areaDiff !== 0) {
          await tx.field.update({
            where: { id: existing.fieldId },
            data: { availableArea: { decrement: areaDiff } },
          });
        }

        return updated;
      });
    }

    return this.prisma.planting.update({
      where: { id },
      data: dto,
      include: { field: true, crop: true },
    });
  }

  async updateStatus(id: string, dto: UpdatePlantingStatusDto) {
    await this.findOne(id);
    return this.prisma.planting.update({
      where: { id },
      data: { status: dto.status },
      include: { field: true, crop: true },
    });
  }

  async remove(id: string) {
    const existing = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.field.update({
        where: { id: existing.fieldId },
        data: { availableArea: { increment: existing.plantedArea } },
      });
      return tx.planting.delete({ where: { id } });
    });
  }
}
