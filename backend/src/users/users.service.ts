import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '../common/enums';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PasswordService } from '../common/services/password.service';
import { paginate, PaginationQueryDto } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';

const userSelect = {
  id: true,
  fullName: true,
  username: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async findAll(query: UserQueryDto & PaginationQueryDto) {
    const { skip, take } = paginate(query.page, query.limit);
    const where = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.search
        ? {
            OR: [
              {
                fullName: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                username: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        select: userSelect,
        orderBy: { fullName: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page: query.page ?? 1, limit: query.limit ?? 20 };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto) {
    await this.ensureUsernameAvailable(dto.username);

    const passwordHash = await this.passwordService.hash(dto.password);
    return this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        username: dto.username,
        passwordHash,
        role: dto.role,
      },
      select: userSelect,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const existing = await this.findOne(id);

    if (dto.username && dto.username !== existing.username) {
      await this.ensureUsernameAvailable(dto.username);
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: userSelect,
    });
  }

  async remove(id: string, currentUser: AuthenticatedUser) {
    const existing = await this.findOne(id);

    if (existing.id === currentUser.id) {
      throw new BadRequestException('You cannot delete your own account');
    }

    if (existing.role === UserRole.FARM_MANAGER) {
      const farmManagerCount = await this.prisma.user.count({
        where: { role: UserRole.FARM_MANAGER },
      });
      if (farmManagerCount <= 1) {
        throw new BadRequestException(
          'Cannot delete the last Farm Manager account',
        );
      }
    }

    return this.prisma.user.delete({
      where: { id },
      select: userSelect,
    });
  }

  async resetPassword(id: string, dto: ResetPasswordDto) {
    await this.findOne(id);

    const passwordHash = await this.passwordService.hash(dto.newPassword);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return { message: 'Password reset successfully' };
  }

  private async ensureUsernameAvailable(username: string) {
    const existing = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existing) {
      throw new ConflictException('Username already exists');
    }
  }
}
