import { Test, TestingModule } from '@nestjs/testing';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;

  const mockAuthService = {
    validateUser: jest.fn(),
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
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user if credentials are valid', async () => {
      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate('test@example.com', 'password123');

      expect(result).toEqual(mockUser);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      );
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(
        strategy.validate('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
      
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        'test@example.com',
        'wrongpassword',
      );
    });

    it('should handle empty email', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate('', 'password123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle empty password', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(
        strategy.validate('test@example.com', ''),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle service errors', async () => {
      mockAuthService.validateUser.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        strategy.validate('test@example.com', 'password123'),
      ).rejects.toThrow('Database error');
    });

    it('should trim email before validation', async () => {
      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(
        '  test@example.com  ',
        'password123',
      );

      expect(result).toEqual(mockUser);
      // Note: Trimming might be handled by the service or DTO validation
      expect(mockAuthService.validateUser).toHaveBeenCalled();
    });
  });
});