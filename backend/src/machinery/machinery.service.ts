import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationQueryDto } from '../common/dto/pagination.dto';
import {
  CreateMachineryDto,
  MachineryQueryDto,
  UpdateMachineryDto,
  UpdateMachineryStatusDto,
} from './dto/machinery.dto';

@Injectable()
export class MachineryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: MachineryQueryDto & PaginationQueryDto) {
    const { skip, take } = paginate(query.page, query.limit);
    const where = {
      ...(query.equipmentType
        ? { equipmentType: { contains: query.equipmentType, mode: 'insensitive' as const } }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { inventoryNumber: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.machinery.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
      this.prisma.machinery.count({ where }),
    ]);

    return { items, total, page: query.page ?? 1, limit: query.limit ?? 20 };
  }

  async findOne(id: string) {
    const machinery = await this.prisma.machinery.findUnique({ where: { id } });
    if (!machinery) throw new NotFoundException('Machinery not found');
    return machinery;
  }

  async create(dto: CreateMachineryDto) {
    try {
      return await this.prisma.machinery.create({ data: dto });
    } catch {
      throw new ConflictException('Inventory number already exists');
    }
  }

  async update(id: string, dto: UpdateMachineryDto) {
    await this.findOne(id);
    try {
      return await this.prisma.machinery.update({ where: { id }, data: dto });
    } catch {
      throw new ConflictException('Inventory number already exists');
    }
  }

  async updateStatus(id: string, dto: UpdateMachineryStatusDto) {
    await this.findOne(id);
    return this.prisma.machinery.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.machinery.delete({ where: { id } });
  }

  async getUsageHistory(id: string) {
    await this.findOne(id);
    return this.prisma.machineryUsage.findMany({
      where: { machineryId: id },
      include: { workRecord: { include: { field: true, agriculturalWork: true } } },
      orderBy: { usageDate: 'desc' },
    });
  }
}
