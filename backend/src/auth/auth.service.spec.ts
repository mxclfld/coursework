import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PasswordService } from '../common/services/password.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../common/enums';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 'user-1',
    fullName: 'Test User',
    username: 'testuser',
    passwordHash: 'hashed-password',
    role: UserRole.FARM_MANAGER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('jwt-token'),
  };

  const configService = {
    get: jest.fn().mockReturnValue('7d'),
  };

  const passwordService = {
    compare: jest.fn(),
    hash: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: PasswordService, useValue: passwordService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('login', () => {
    it('returns access token and user on valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      passwordService.compare.mockResolvedValue(true);

      const result = await service.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(result).toEqual({
        accessToken: 'jwt-token',
        expiresIn: '7d',
        user: {
          id: mockUser.id,
          fullName: mockUser.fullName,
          username: mockUser.username,
          role: mockUser.role,
        },
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
      });
    });

    it('throws when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ username: 'unknown', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws when password is invalid', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      passwordService.compare.mockResolvedValue(false);

      await expect(
        service.login({ username: 'testuser', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('returns the authenticated user profile', async () => {
      const profile = {
        id: mockUser.id,
        fullName: mockUser.fullName,
        username: mockUser.username,
        role: mockUser.role,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      };
      prisma.user.findUnique.mockResolvedValue(profile);

      const result = await service.getProfile({
        id: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
      });

      expect(result).toEqual(profile);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: {
          id: true,
          fullName: true,
          username: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  });

  describe('updateProfile', () => {
    it('updates full name for the authenticated user', async () => {
      const updated = {
        id: mockUser.id,
        fullName: 'Updated Name',
        username: mockUser.username,
        role: mockUser.role,
        updatedAt: new Date(),
      };
      prisma.user.update.mockResolvedValue(updated);

      const result = await service.updateProfile(
        { id: mockUser.id, username: mockUser.username, role: mockUser.role },
        { fullName: 'Updated Name' },
      );

      expect(result).toEqual(updated);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { fullName: 'Updated Name' },
        select: {
          id: true,
          fullName: true,
          username: true,
          role: true,
          updatedAt: true,
        },
      });
    });
  });

  describe('resetOwnPassword', () => {
    it('resets password when current password is correct', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      passwordService.compare.mockResolvedValue(true);
      passwordService.hash.mockResolvedValue('new-hash');
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await service.resetOwnPassword(
        { id: mockUser.id, username: mockUser.username, role: mockUser.role },
        { currentPassword: 'old', newPassword: 'new-password' },
      );

      expect(result).toEqual({ message: 'Password reset successfully' });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { passwordHash: 'new-hash' },
      });
    });

    it('throws when current password is incorrect', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      passwordService.compare.mockResolvedValue(false);

      await expect(
        service.resetOwnPassword(
          { id: mockUser.id, username: mockUser.username, role: mockUser.role },
          { currentPassword: 'wrong', newPassword: 'new-password' },
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws when user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.resetOwnPassword(
          { id: mockUser.id, username: mockUser.username, role: mockUser.role },
          { currentPassword: 'old', newPassword: 'new-password' },
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
