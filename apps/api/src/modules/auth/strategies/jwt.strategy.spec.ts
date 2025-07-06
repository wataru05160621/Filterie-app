import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockUsersService = {
    findOne: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      return null;
    }),
  };

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user if valid payload', async () => {
      const payload = { sub: 'user-id', email: 'test@example.com' };
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findOne).toHaveBeenCalledWith('user-id');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const payload = { sub: 'non-existent', email: 'test@example.com' };
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if payload is invalid', async () => {
      const invalidPayload = { sub: null, email: 'test@example.com' };

      await expect(strategy.validate(invalidPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUsersService.findOne).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const payload = { sub: 'user-id', email: 'test@example.com' };
      mockUsersService.findOne.mockRejectedValue(new Error('Database error'));

      await expect(strategy.validate(payload)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('constructor', () => {
    it('should configure JWT options from ConfigService', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
    });
  });
});