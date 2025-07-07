import { Test, TestingModule } from '@nestjs/testing';
import { TraysService } from './trays.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('TraysService', () => {
  let service: TraysService;

  const mockPrismaService = {
    tray: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    trayItem: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TraysService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TraysService>(TraysService);

    jest.clearAllMocks();
  });

  describe('createTray', () => {
    it('should create a new tray for user', async () => {
      const userId = 'user-1';
      const createTrayDto = {
        name: 'Tech Articles',
        description: 'Collection of tech articles',
        isPublic: false,
      };

      const mockTray = {
        id: 'tray-1',
        userId,
        ...createTrayDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.tray.create.mockResolvedValue(mockTray);

      const result = await service.createTray(userId, createTrayDto);

      expect(result).toEqual(mockTray);
      expect(mockPrismaService.tray.create).toHaveBeenCalledWith({
        data: {
          userId,
          ...createTrayDto,
        },
      });
    });

    it('should create a public tray when specified', async () => {
      const userId = 'user-1';
      const createTrayDto = {
        name: 'Public Tech Resources',
        description: 'Curated tech resources for everyone',
        isPublic: true,
      };

      const mockTray = {
        id: 'tray-2',
        userId,
        ...createTrayDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.tray.create.mockResolvedValue(mockTray);

      const result = await service.createTray(userId, createTrayDto);

      expect(result.isPublic).toBe(true);
    });
  });

  describe('getUserTrays', () => {
    it('should return all trays for a user', async () => {
      const userId = 'user-1';
      const mockTrays = [
        {
          id: 'tray-1',
          userId,
          name: 'Tech Articles',
          description: 'Collection of tech articles',
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { items: 5 },
        },
        {
          id: 'tray-2',
          userId,
          name: 'Design Resources',
          description: 'UI/UX design resources',
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { items: 3 },
        },
      ];

      mockPrismaService.tray.findMany.mockResolvedValue(mockTrays);

      const result = await service.getUserTrays(userId);

      expect(result).toEqual(mockTrays);
      expect(mockPrismaService.tray.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          _count: {
            select: { items: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    });
  });

  describe('getTray', () => {
    it('should return tray details with items', async () => {
      const trayId = 'tray-1';
      const userId = 'user-1';
      const mockTray = {
        id: trayId,
        userId,
        name: 'Tech Articles',
        description: 'Collection of tech articles',
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: 'item-1',
            trayId,
            articleId: 'article-1',
            note: 'Great article on React',
            addedAt: new Date(),
            article: {
              id: 'article-1',
              title: 'React Best Practices',
              url: 'https://example.com/react',
              summary: 'Best practices for React development',
              source: { name: 'Tech Blog', tier: 2 },
            },
          },
        ],
      };

      mockPrismaService.tray.findUnique.mockResolvedValue(mockTray);

      const result = await service.getTray(trayId, userId);

      expect(result).toEqual(mockTray);
      expect(mockPrismaService.tray.findUnique).toHaveBeenCalledWith({
        where: { id: trayId },
        include: {
          items: {
            include: {
              article: {
                include: {
                  source: true,
                },
              },
            },
            orderBy: { addedAt: 'desc' },
          },
        },
      });
    });

    it('should throw NotFoundException when tray not found', async () => {
      mockPrismaService.tray.findUnique.mockResolvedValue(null);

      await expect(service.getTray('invalid-id', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when accessing private tray of another user', async () => {
      const mockTray = {
        id: 'tray-1',
        userId: 'user-1',
        isPublic: false,
      };

      mockPrismaService.tray.findUnique.mockResolvedValue(mockTray);

      await expect(service.getTray('tray-1', 'user-2')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow access to public tray of another user', async () => {
      const mockTray = {
        id: 'tray-1',
        userId: 'user-1',
        isPublic: true,
        name: 'Public Resources',
      };

      mockPrismaService.tray.findUnique.mockResolvedValue(mockTray);

      const result = await service.getTray('tray-1', 'user-2');
      expect(result).toEqual(mockTray);
    });
  });

  describe('addItemToTray', () => {
    it('should add article to tray', async () => {
      const trayId = 'tray-1';
      const userId = 'user-1';
      const addItemDto = {
        articleId: 'article-1',
        note: 'Important article',
      };

      const mockTray = {
        id: trayId,
        userId,
        isPublic: false,
      };

      const mockItem = {
        id: 'item-1',
        trayId,
        ...addItemDto,
        addedAt: new Date(),
      };

      mockPrismaService.tray.findUnique.mockResolvedValue(mockTray);
      mockPrismaService.trayItem.create.mockResolvedValue(mockItem);

      const result = await service.addItemToTray(trayId, userId, addItemDto);

      expect(result).toEqual(mockItem);
      expect(mockPrismaService.trayItem.create).toHaveBeenCalledWith({
        data: {
          trayId,
          ...addItemDto,
        },
      });
    });

    it('should throw ForbiddenException when adding to another user tray', async () => {
      const mockTray = {
        id: 'tray-1',
        userId: 'user-1',
        isPublic: false,
      };

      mockPrismaService.tray.findUnique.mockResolvedValue(mockTray);

      await expect(
        service.addItemToTray('tray-1', 'user-2', {
          articleId: 'article-1',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeItemFromTray', () => {
    it('should remove item from tray', async () => {
      const itemId = 'item-1';
      const userId = 'user-1';

      const mockItem = {
        id: itemId,
        tray: {
          userId,
        },
      };

      mockPrismaService.trayItem.findUnique.mockResolvedValue(mockItem);
      mockPrismaService.trayItem.delete.mockResolvedValue(mockItem);

      await service.removeItemFromTray(itemId, userId);

      expect(mockPrismaService.trayItem.delete).toHaveBeenCalledWith({
        where: { id: itemId },
      });
    });

    it('should throw NotFoundException when item not found', async () => {
      mockPrismaService.trayItem.findUnique.mockResolvedValue(null);

      await expect(
        service.removeItemFromTray('invalid-id', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteTray', () => {
    it('should delete tray and all its items', async () => {
      const trayId = 'tray-1';
      const userId = 'user-1';

      const mockTray = {
        id: trayId,
        userId,
      };

      mockPrismaService.tray.findUnique.mockResolvedValue(mockTray);
      mockPrismaService.tray.delete.mockResolvedValue(mockTray);

      await service.deleteTray(trayId, userId);

      expect(mockPrismaService.tray.delete).toHaveBeenCalledWith({
        where: { id: trayId },
      });
    });

    it('should throw ForbiddenException when deleting another user tray', async () => {
      const mockTray = {
        id: 'tray-1',
        userId: 'user-1',
      };

      mockPrismaService.tray.findUnique.mockResolvedValue(mockTray);

      await expect(service.deleteTray('tray-1', 'user-2')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getPublicTrays', () => {
    it('should return all public trays', async () => {
      const mockPublicTrays = [
        {
          id: 'tray-1',
          name: 'Public Tech Resources',
          isPublic: true,
          user: { name: 'John Doe' },
          _count: { items: 10 },
        },
        {
          id: 'tray-2',
          name: 'Design Inspiration',
          isPublic: true,
          user: { name: 'Jane Smith' },
          _count: { items: 5 },
        },
      ];

      mockPrismaService.tray.findMany.mockResolvedValue(mockPublicTrays);

      const result = await service.getPublicTrays();

      expect(result).toEqual(mockPublicTrays);
      expect(mockPrismaService.tray.findMany).toHaveBeenCalledWith({
        where: { isPublic: true },
        include: {
          user: {
            select: { name: true },
          },
          _count: {
            select: { items: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    });
  });
});