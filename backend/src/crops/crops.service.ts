import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationQueryDto } from '../common/dto/pagination.dto';
import { CreateCropDto, CropQueryDto, UpdateCropDto } from './dto/crop.dto';

@Injectable()
export class CropsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: CropQueryDto & PaginationQueryDto) {
    const { skip, take } = paginate(query.page, query.limit);
    const where = {
      ...(query.type ? { type: { contains: query.type, mode: 'insensitive' as const } } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { type: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.crop.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
      this.prisma.crop.count({ where }),
    ]);

    return { items, total, page: query.page ?? 1, limit: query.limit ?? 20 };
  }

  async findOne(id: string) {
    const crop = await this.prisma.crop.findUnique({ where: { id } });
    if (!crop) throw new NotFoundException('Crop not found');
    return crop;
  }

  create(dto: CreateCropDto) {
    return this.prisma.crop.create({ data: dto });
  }

  async update(id: string, dto: UpdateCropDto) {
    await this.findOne(id);
    return this.prisma.crop.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.crop.delete({ where: { id } });
  }
}
