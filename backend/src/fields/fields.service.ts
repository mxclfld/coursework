import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationQueryDto } from '../common/dto/pagination.dto';
import { CreateFieldDto, FieldQueryDto, UpdateFieldDto } from './dto/field.dto';

@Injectable()
export class FieldsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FieldQueryDto & PaginationQueryDto) {
    const { skip, take } = paginate(query.page, query.limit);
    const where = {
      ...(query.location ? { location: { contains: query.location, mode: 'insensitive' as const } } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { location: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.field.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
      this.prisma.field.count({ where }),
    ]);

    return { items, total, page: query.page ?? 1, limit: query.limit ?? 20 };
  }

  async findOne(id: string) {
    const field = await this.prisma.field.findUnique({ where: { id } });
    if (!field) throw new NotFoundException('Field not found');
    return field;
  }

  async create(dto: CreateFieldDto) {
    const availableArea = dto.availableArea ?? dto.area;
    if (availableArea > dto.area) {
      throw new BadRequestException('Available area cannot exceed total area');
    }

    return this.prisma.field.create({
      data: {
        name: dto.name,
        area: dto.area,
        location: dto.location,
        availableArea,
        description: dto.description,
      },
    });
  }

  async update(id: string, dto: UpdateFieldDto) {
    await this.findOne(id);
    if (dto.area !== undefined && dto.availableArea !== undefined && dto.availableArea > dto.area) {
      throw new BadRequestException('Available area cannot exceed total area');
    }

    return this.prisma.field.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.field.delete({ where: { id } });
  }

  async getPlantings(id: string) {
    await this.findOne(id);
    return this.prisma.planting.findMany({
      where: { fieldId: id },
      include: { crop: true, createdBy: { select: { id: true, fullName: true } } },
      orderBy: { plantingDate: 'desc' },
    });
  }

  async getWorkRecords(id: string) {
    await this.findOne(id);
    return this.prisma.workRecord.findMany({
      where: { fieldId: id },
      include: {
        agriculturalWork: true,
        machinery: true,
        createdBy: { select: { id: true, fullName: true } },
      },
      orderBy: { completionDate: 'desc' },
    });
  }
}
