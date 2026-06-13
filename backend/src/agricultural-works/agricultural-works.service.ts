import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationQueryDto } from '../common/dto/pagination.dto';
import {
  AgriculturalWorkQueryDto,
  CreateAgriculturalWorkDto,
  UpdateAgriculturalWorkDto,
} from './dto/agricultural-work.dto';

@Injectable()
export class AgriculturalWorksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: AgriculturalWorkQueryDto & PaginationQueryDto) {
    const { skip, take } = paginate(query.page, query.limit);
    const where = query.search
      ? {
          OR: [
            { workType: { contains: query.search, mode: 'insensitive' as const } },
            { description: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.agriculturalWork.findMany({ where, skip, take, orderBy: { workType: 'asc' } }),
      this.prisma.agriculturalWork.count({ where }),
    ]);

    return { items, total, page: query.page ?? 1, limit: query.limit ?? 20 };
  }

  async findOne(id: string) {
    const work = await this.prisma.agriculturalWork.findUnique({ where: { id } });
    if (!work) throw new NotFoundException('Agricultural work not found');
    return work;
  }

  create(dto: CreateAgriculturalWorkDto) {
    return this.prisma.agriculturalWork.create({ data: dto });
  }

  async update(id: string, dto: UpdateAgriculturalWorkDto) {
    await this.findOne(id);
    return this.prisma.agriculturalWork.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.agriculturalWork.delete({ where: { id } });
  }
}
