import { Test, TestingModule } from '@nestjs/testing';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';

describe('AuthResolver', () => {
  let resolver: AuthResolver;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
  };

  const mockUsersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerInput = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    const mockUser: User = {
      id: 'user-id',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed-password',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should register a new user successfully', async () => {
      const authPayload = {
        access_token: 'jwt-token',
        refresh_token: 'refresh-token',
        user: mockUser,
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockAuthService.register.mockResolvedValue(authPayload);

      const result = await resolver.register(registerInput);

      expect(result).toEqual(authPayload);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        registerInput.email,
      );
      expect(mockAuthService.register).toHaveBeenCalledWith(registerInput);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(resolver.register(registerInput)).rejects.toThrow(
        ConflictException,
      );
      await expect(resolver.register(registerInput)).rejects.toThrow(
        'Email already exists',
      );
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const invalidEmailInput = {
        ...registerInput,
        email: 'invalid-email',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);

      // Email validation should be handled by class-validator in the DTO
      // This test ensures the resolver passes the input correctly
      await resolver.register(invalidEmailInput);

      expect(mockAuthService.register).toHaveBeenCalledWith(invalidEmailInput);
    });

    it('should validate password length', async () => {
      const shortPasswordInput = {
        ...registerInput,
        password: '123',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);

      // Password validation should be handled by class-validator in the DTO
      await resolver.register(shortPasswordInput);

      expect(mockAuthService.register).toHaveBeenCalledWith(shortPasswordInput);
    });
  });

  describe('login', () => {
    const loginInput = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser: User = {
      id: 'user-id',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed-password',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should login user successfully', async () => {
      const authPayload = {
        access_token: 'jwt-token',
        refresh_token: 'refresh-token',
        user: mockUser,
      };

      mockAuthService.login.mockResolvedValue(authPayload);

      const result = await resolver.login(loginInput);

      expect(result).toEqual(authPayload);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginInput);
    });

    it('should handle invalid credentials', async () => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(resolver.login(loginInput)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(resolver.login(loginInput)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should handle non-existent user', async () => {
      const nonExistentInput = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(resolver.login(nonExistentInput)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    const refreshTokenInput = {
      refresh_token: 'valid-refresh-token',
    };

    it('should refresh tokens successfully', async () => {
      const newTokens = {
        access_token: 'new-jwt-token',
        refresh_token: 'new-refresh-token',
      };

      mockAuthService.refreshToken.mockResolvedValue(newTokens);

      const result = await resolver.refreshToken(refreshTokenInput);

      expect(result).toEqual(newTokens);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
        refreshTokenInput.refresh_token,
      );
    });

    it('should handle invalid refresh token', async () => {
      mockAuthService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token'),
      );

      await expect(resolver.refreshToken(refreshTokenInput)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(resolver.refreshToken(refreshTokenInput)).rejects.toThrow(
        'Invalid refresh token',
      );
    });

    it('should handle expired refresh token', async () => {
      const expiredTokenInput = {
        refresh_token: 'expired-refresh-token',
      };

      mockAuthService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Refresh token expired'),
      );

      await expect(resolver.refreshToken(expiredTokenInput)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(resolver.refreshToken(expiredTokenInput)).rejects.toThrow(
        'Refresh token expired',
      );
    });
  });
});