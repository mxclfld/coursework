import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationQueryDto } from '../common/dto/pagination.dto';
import {
  CreateMachineryUsageDto,
  MachineryUsageQueryDto,
  UpdateMachineryUsageDto,
} from './dto/machinery-usage.dto';

@Injectable()
export class MachineryUsageService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: MachineryUsageQueryDto & PaginationQueryDto) {
    const { skip, take } = paginate(query.page, query.limit);
    const where = {
      ...(query.machineryId ? { machineryId: query.machineryId } : {}),
      ...(query.workRecordId ? { workRecordId: query.workRecordId } : {}),
      ...(query.startDate || query.endDate
        ? {
            usageDate: {
              ...(query.startDate ? { gte: query.startDate } : {}),
              ...(query.endDate ? { lte: query.endDate } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.machineryUsage.findMany({
        where,
        skip,
        take,
        include: {
          machinery: true,
          workRecord: { include: { field: true, agriculturalWork: true } },
        },
        orderBy: { usageDate: 'desc' },
      }),
      this.prisma.machineryUsage.count({ where }),
    ]);

    return { items, total, page: query.page ?? 1, limit: query.limit ?? 20 };
  }

  async findOne(id: string) {
    const usage = await this.prisma.machineryUsage.findUnique({
      where: { id },
      include: {
        machinery: true,
        workRecord: { include: { field: true, agriculturalWork: true } },
      },
    });
    if (!usage) throw new NotFoundException('Machinery usage record not found');
    return usage;
  }

  async create(dto: CreateMachineryUsageDto) {
    await this.ensureReferencesExist(dto.machineryId, dto.workRecordId);
    return this.prisma.machineryUsage.create({
      data: dto,
      include: { machinery: true, workRecord: true },
    });
  }

  async update(id: string, dto: UpdateMachineryUsageDto) {
    const existing = await this.findOne(id);
    await this.ensureReferencesExist(
      dto.machineryId ?? existing.machineryId,
      dto.workRecordId ?? existing.workRecordId,
    );
    return this.prisma.machineryUsage.update({
      where: { id },
      data: dto,
      include: { machinery: true, workRecord: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.machineryUsage.delete({ where: { id } });
  }

  private async ensureReferencesExist(machineryId: string, workRecordId: string) {
    const [machinery, workRecord] = await Promise.all([
      this.prisma.machinery.findUnique({ where: { id: machineryId } }),
      this.prisma.workRecord.findUnique({ where: { id: workRecordId } }),
    ]);
    if (!machinery) throw new NotFoundException('Machinery not found');
    if (!workRecord) throw new NotFoundException('Work record not found');
  }
}
