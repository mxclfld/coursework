import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationQueryDto } from '../common/dto/pagination.dto';
import {
  CreateFertilizerDto,
  FertilizerQueryDto,
  UpdateFertilizerDto,
} from './dto/fertilizer.dto';

@Injectable()
export class FertilizersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FertilizerQueryDto & PaginationQueryDto) {
    const { skip, take } = paginate(query.page, query.limit);
    const where = {
      ...(query.type
        ? { type: { contains: query.type, mode: 'insensitive' as const } }
        : {}),
      ...(query.search
        ? {
            OR: [
              {
                name: { contains: query.search, mode: 'insensitive' as const },
              },
              {
                type: { contains: query.search, mode: 'insensitive' as const },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.fertilizer.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      this.prisma.fertilizer.count({ where }),
    ]);

    return { items, total, page: query.page ?? 1, limit: query.limit ?? 20 };
  }

  async findOne(id: string) {
    const fertilizer = await this.prisma.fertilizer.findUnique({
      where: { id },
    });
    if (!fertilizer) throw new NotFoundException('Fertilizer not found');
    return fertilizer;
  }

  create(dto: CreateFertilizerDto) {
    return this.prisma.fertilizer.create({ data: dto });
  }

  async update(id: string, dto: UpdateFertilizerDto) {
    await this.findOne(id);
    return this.prisma.fertilizer.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.fertilizer.delete({ where: { id } });
  }
}
