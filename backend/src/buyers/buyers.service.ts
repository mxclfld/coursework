import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, PaginationQueryDto } from '../common/dto/pagination.dto';
import { BuyerQueryDto, CreateBuyerDto, UpdateBuyerDto } from './dto/buyer.dto';

@Injectable()
export class BuyersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: BuyerQueryDto & PaginationQueryDto) {
    const { skip, take } = paginate(query.page, query.limit);
    const where = query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' as const } },
            { address: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.buyer.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
      this.prisma.buyer.count({ where }),
    ]);

    return { items, total, page: query.page ?? 1, limit: query.limit ?? 20 };
  }

  async findOne(id: string) {
    const buyer = await this.prisma.buyer.findUnique({ where: { id } });
    if (!buyer) throw new NotFoundException('Buyer not found');
    return buyer;
  }

  create(dto: CreateBuyerDto) {
    return this.prisma.buyer.create({ data: dto });
  }

  async update(id: string, dto: UpdateBuyerDto) {
    await this.findOne(id);
    return this.prisma.buyer.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.buyer.delete({ where: { id } });
  }

  async getSales(id: string) {
    await this.findOne(id);
    return this.prisma.sale.findMany({
      where: { buyerId: id },
      include: {
        crop: true,
        field: true,
        createdBy: { select: { id: true, fullName: true } },
      },
      orderBy: { saleDate: 'desc' },
    });
  }
}
