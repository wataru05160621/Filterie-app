import { Test, TestingModule } from '@nestjs/testing';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { UnauthorizedException } from '@nestjs/common';

describe('UsersResolver', () => {
  let resolver: UsersResolver;

  const mockUsersService = {
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
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
        UsersResolver,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    resolver = module.get<UsersResolver>(UsersResolver);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('me', () => {
    it('should return the current user', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await resolver.me(mockUser);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(resolver.me(mockUser)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('users', () => {
    it('should return paginated users', async () => {
      const paginationInput = { page: 1, limit: 10 };
      const paginatedResult = {
        items: [mockUser],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockUsersService.findAll.mockResolvedValue(paginatedResult);

      const result = await resolver.users(paginationInput);

      expect(result).toEqual(paginatedResult);
      expect(mockUsersService.findAll).toHaveBeenCalledWith(paginationInput);
    });

    it('should handle empty filter', async () => {
      const paginatedResult = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockUsersService.findAll.mockResolvedValue(paginatedResult);

      const result = await resolver.users({});

      expect(result).toEqual(paginatedResult);
      expect(mockUsersService.findAll).toHaveBeenCalledWith({});
    });

    it('should pass search filter to service', async () => {
      const filter = { page: 1, limit: 10, search: 'test' };
      const paginatedResult = {
        items: [mockUser],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockUsersService.findAll.mockResolvedValue(paginatedResult);

      const result = await resolver.users(filter);

      expect(result).toEqual(paginatedResult);
      expect(mockUsersService.findAll).toHaveBeenCalledWith(filter);
    });
  });

  describe('user', () => {
    it('should return a user by id', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await resolver.user('user-id');

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findOne).toHaveBeenCalledWith('user-id');
    });

    it('should return null if user not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      const result = await resolver.user('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update the current user profile', async () => {
      const updateData = { name: 'Updated Name' };
      const updatedUser = { ...mockUser, name: 'Updated Name' };

      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await resolver.updateProfile(mockUser, updateData);

      expect(result).toEqual(updatedUser);
      expect(mockUsersService.update).toHaveBeenCalledWith(
        mockUser.id,
        updateData,
      );
    });

    it('should allow updating email', async () => {
      const updateData = { email: 'newemail@example.com' };
      const updatedUser = { ...mockUser, email: 'newemail@example.com' };

      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await resolver.updateProfile(mockUser, updateData);

      expect(result).toEqual(updatedUser);
      expect(mockUsersService.update).toHaveBeenCalledWith(
        mockUser.id,
        updateData,
      );
    });

    it('should allow updating password', async () => {
      const updateData = { password: 'newpassword123' };
      const updatedUser = { ...mockUser };

      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await resolver.updateProfile(mockUser, updateData);

      expect(result).toEqual(updatedUser);
      expect(mockUsersService.update).toHaveBeenCalledWith(
        mockUser.id,
        updateData,
      );
    });
  });

  describe('deleteAccount', () => {
    it('should delete the current user account', async () => {
      mockUsersService.remove.mockResolvedValue(mockUser);

      const result = await resolver.deleteAccount(mockUser);

      expect(result).toBe(true);
      expect(mockUsersService.remove).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return false if deletion fails', async () => {
      mockUsersService.remove.mockRejectedValue(new Error('Deletion failed'));

      const result = await resolver.deleteAccount(mockUser);

      expect(result).toBe(false);
      expect(mockUsersService.remove).toHaveBeenCalledWith(mockUser.id);
    });
  });
});