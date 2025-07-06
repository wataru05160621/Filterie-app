import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (
    headers = {},
  ): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          headers,
        }),
      }),
    } as any;
  };

  describe('canActivate', () => {
    it('should allow access to public routes', async () => {
      const context = createMockExecutionContext();
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should require authentication for non-public routes', async () => {
      const context = createMockExecutionContext({
        authorization: 'Bearer valid-token',
      });
      mockReflector.getAllAndOverride.mockReturnValue(false);

      // Mock the parent canActivate method
      const parentCanActivate = jest
        .spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockResolvedValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(parentCanActivate).toHaveBeenCalledWith(context);

      parentCanActivate.mockRestore();
    });

    it('should reject requests without authorization header', async () => {
      const context = createMockExecutionContext({});
      mockReflector.getAllAndOverride.mockReturnValue(false);

      // Mock the parent canActivate method to throw
      const parentCanActivate = jest
        .spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockRejectedValue(new UnauthorizedException());

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );

      parentCanActivate.mockRestore();
    });

    it('should reject requests with invalid token', async () => {
      const context = createMockExecutionContext({
        authorization: 'Bearer invalid-token',
      });
      mockReflector.getAllAndOverride.mockReturnValue(false);

      const parentCanActivate = jest
        .spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockRejectedValue(new UnauthorizedException('Invalid token'));

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow('Invalid token');

      parentCanActivate.mockRestore();
    });

    it('should handle malformed authorization header', async () => {
      const context = createMockExecutionContext({
        authorization: 'InvalidFormat',
      });
      mockReflector.getAllAndOverride.mockReturnValue(false);

      const parentCanActivate = jest
        .spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockRejectedValue(new UnauthorizedException());

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );

      parentCanActivate.mockRestore();
    });
  });

  describe('handleRequest', () => {
    it('should return user if authentication successful', () => {
      const user = { id: 'user-id', email: 'test@example.com' };
      const result = guard.handleRequest(null, user);

      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException if no user', () => {
      expect(() => guard.handleRequest(null, null)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw original error if error provided', () => {
      const error = new Error('Custom error');
      expect(() => guard.handleRequest(error, null)).toThrow(error);
    });

    it('should prioritize error over missing user', () => {
      const error = new Error('Authentication failed');
      expect(() => guard.handleRequest(error, null)).toThrow(error);
    });
  });
});