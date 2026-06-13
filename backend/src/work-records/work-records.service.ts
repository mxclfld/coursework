import { Injectable, NotFoundException } from '@nestjs/common';
import { MachineryStatus } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { paginate, PaginationQueryDto } from '../common/dto/pagination.dto';
import {
  CreateWorkRecordDto,
  UpdateWorkRecordDto,
  WorkRecordQueryDto,
} from './dto/work-record.dto';

@Injectable()
export class WorkRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: WorkRecordQueryDto & PaginationQueryDto) {
    const { skip, take } = paginate(query.page, query.limit);
    const where = {
      ...(query.fieldId ? { fieldId: query.fieldId } : {}),
      ...(query.agriculturalWorkId
        ? { agriculturalWorkId: query.agriculturalWorkId }
        : {}),
      ...(query.startDate || query.endDate
        ? {
            completionDate: {
              ...(query.startDate ? { gte: query.startDate } : {}),
              ...(query.endDate ? { lte: query.endDate } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.workRecord.findMany({
        where,
        skip,
        take,
        include: {
          field: true,
          agriculturalWork: true,
          machinery: true,
          createdBy: { select: { id: true, fullName: true } },
        },
        orderBy: { completionDate: 'desc' },
      }),
      this.prisma.workRecord.count({ where }),
    ]);

    return { items, total, page: query.page ?? 1, limit: query.limit ?? 20 };
  }

  async findOne(id: string) {
    const record = await this.prisma.workRecord.findUnique({
      where: { id },
      include: {
        field: true,
        agriculturalWork: true,
        machinery: true,
        machineryUsage: true,
        createdBy: { select: { id: true, fullName: true } },
      },
    });
    if (!record) throw new NotFoundException('Work record not found');
    return record;
  }

  async create(dto: CreateWorkRecordDto, user: AuthenticatedUser) {
    await this.ensureReferencesExist(dto.fieldId, dto.agriculturalWorkId, dto.machineryId);

    return this.prisma.$transaction(async (tx) => {
      const record = await tx.workRecord.create({
        data: {
          fieldId: dto.fieldId,
          agriculturalWorkId: dto.agriculturalWorkId,
          machineryId: dto.machineryId,
          completionDate: dto.completionDate,
          description: dto.description,
          createdById: user.id,
        },
        include: {
          field: true,
          agriculturalWork: true,
          machinery: true,
        },
      });

      if (dto.machineryId) {
        await tx.machinery.update({
          where: { id: dto.machineryId },
          data: { status: MachineryStatus.IN_USE },
        });
      }

      return record;
    });
  }

  async update(id: string, dto: UpdateWorkRecordDto) {
    const existing = await this.findOne(id);
    await this.ensureReferencesExist(
      dto.fieldId ?? existing.fieldId,
      dto.agriculturalWorkId ?? existing.agriculturalWorkId,
      dto.machineryId ?? existing.machineryId ?? undefined,
    );

    return this.prisma.$transaction(async (tx) => {
      if (existing.machineryId && existing.machineryId !== dto.machineryId) {
        await tx.machinery.update({
          where: { id: existing.machineryId },
          data: { status: MachineryStatus.AVAILABLE },
        });
      }

      const updated = await tx.workRecord.update({
        where: { id },
        data: dto,
        include: {
          field: true,
          agriculturalWork: true,
          machinery: true,
        },
      });

      if (dto.machineryId) {
        await tx.machinery.update({
          where: { id: dto.machineryId },
          data: { status: MachineryStatus.IN_USE },
        });
      }

      return updated;
    });
  }

  async remove(id: string) {
    const existing = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      if (existing.machineryId) {
        await tx.machinery.update({
          where: { id: existing.machineryId },
          data: { status: MachineryStatus.AVAILABLE },
        });
      }
      return tx.workRecord.delete({ where: { id } });
    });
  }

  private async ensureReferencesExist(
    fieldId: string,
    agriculturalWorkId: string,
    machineryId?: string,
  ) {
    const [field, work, machinery] = await Promise.all([
      this.prisma.field.findUnique({ where: { id: fieldId } }),
      this.prisma.agriculturalWork.findUnique({ where: { id: agriculturalWorkId } }),
      machineryId
        ? this.prisma.machinery.findUnique({ where: { id: machineryId } })
        : Promise.resolve(true),
    ]);

    if (!field) throw new NotFoundException('Field not found');
    if (!work) throw new NotFoundException('Agricultural work not found');
    if (machineryId && !machinery) throw new NotFoundException('Machinery not found');
  }
}
