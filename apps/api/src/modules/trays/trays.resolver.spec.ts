import { Test, TestingModule } from '@nestjs/testing';
import { TraysResolver } from './trays.resolver';
import { TraysService } from './trays.service';

describe('TraysResolver', () => {
  let resolver: TraysResolver;
  let traysService: TraysService;

  const mockTraysService = {
    createTray: jest.fn(),
    getUserTrays: jest.fn(),
    getTray: jest.fn(),
    updateTray: jest.fn(),
    deleteTray: jest.fn(),
    addItemToTray: jest.fn(),
    removeItemFromTray: jest.fn(),
    getPublicTrays: jest.fn(),
    getTrayStats: jest.fn(),
  };

  const mockUser = {
    userId: 'user-1',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TraysResolver,
        {
          provide: TraysService,
          useValue: mockTraysService,
        },
      ],
    }).compile();

    resolver = module.get<TraysResolver>(TraysResolver);
    traysService = module.get<TraysService>(TraysService);

    jest.clearAllMocks();
  });

  describe('createTray', () => {
    it('should create a new tray', async () => {
      const createTrayDto = {
        name: 'Tech Articles',
        description: 'Collection of tech articles',
        isPublic: false,
      };

      const mockTray = {
        id: 'tray-1',
        userId: mockUser.userId,
        ...createTrayDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTraysService.createTray.mockResolvedValue(mockTray);

      const result = await resolver.createTray(mockUser, createTrayDto);

      expect(result).toEqual(mockTray);
      expect(mockTraysService.createTray).toHaveBeenCalledWith(
        mockUser.userId,
        createTrayDto,
      );
    });
  });

  describe('myTrays', () => {
    it('should return user trays', async () => {
      const mockTrays = [
        {
          id: 'tray-1',
          name: 'Tech Articles',
          _count: { items: 5 },
        },
        {
          id: 'tray-2',
          name: 'Design Resources',
          _count: { items: 3 },
        },
      ];

      mockTraysService.getUserTrays.mockResolvedValue(mockTrays);

      const result = await resolver.myTrays(mockUser);

      expect(result).toEqual(mockTrays);
      expect(mockTraysService.getUserTrays).toHaveBeenCalledWith(mockUser.userId);
    });
  });

  describe('tray', () => {
    it('should return tray details', async () => {
      const trayId = 'tray-1';
      const mockTray = {
        id: trayId,
        name: 'Tech Articles',
        items: [],
      };

      mockTraysService.getTray.mockResolvedValue(mockTray);

      const result = await resolver.tray(trayId, mockUser);

      expect(result).toEqual(mockTray);
      expect(mockTraysService.getTray).toHaveBeenCalledWith(
        trayId,
        mockUser.userId,
      );
    });
  });

  describe('updateTray', () => {
    it('should update tray', async () => {
      const trayId = 'tray-1';
      const updateTrayDto = {
        name: 'Updated Tech Articles',
        isPublic: true,
      };

      const mockUpdatedTray = {
        id: trayId,
        ...updateTrayDto,
      };

      mockTraysService.updateTray.mockResolvedValue(mockUpdatedTray);

      const result = await resolver.updateTray(trayId, updateTrayDto, mockUser);

      expect(result).toEqual(mockUpdatedTray);
      expect(mockTraysService.updateTray).toHaveBeenCalledWith(
        trayId,
        mockUser.userId,
        updateTrayDto,
      );
    });
  });

  describe('deleteTray', () => {
    it('should delete tray', async () => {
      const trayId = 'tray-1';

      mockTraysService.deleteTray.mockResolvedValue({ id: trayId });

      const result = await resolver.deleteTray(trayId, mockUser);

      expect(result).toBe(true);
      expect(mockTraysService.deleteTray).toHaveBeenCalledWith(
        trayId,
        mockUser.userId,
      );
    });
  });

  describe('addToTray', () => {
    it('should add item to tray', async () => {
      const trayId = 'tray-1';
      const addItemDto = {
        articleId: 'article-1',
        note: 'Important article',
      };

      const mockItem = {
        id: 'item-1',
        trayId,
        ...addItemDto,
      };

      mockTraysService.addItemToTray.mockResolvedValue(mockItem);

      const result = await resolver.addToTray(trayId, addItemDto, mockUser);

      expect(result).toEqual(mockItem);
      expect(mockTraysService.addItemToTray).toHaveBeenCalledWith(
        trayId,
        mockUser.userId,
        addItemDto,
      );
    });
  });

  describe('removeFromTray', () => {
    it('should remove item from tray', async () => {
      const itemId = 'item-1';

      mockTraysService.removeItemFromTray.mockResolvedValue({ id: itemId });

      const result = await resolver.removeFromTray(itemId, mockUser);

      expect(result).toBe(true);
      expect(mockTraysService.removeItemFromTray).toHaveBeenCalledWith(
        itemId,
        mockUser.userId,
      );
    });
  });

  describe('publicTrays', () => {
    it('should return public trays', async () => {
      const mockPublicTrays = [
        {
          id: 'tray-1',
          name: 'Public Tech Resources',
          user: { name: 'John Doe' },
          _count: { items: 10 },
        },
      ];

      mockTraysService.getPublicTrays.mockResolvedValue(mockPublicTrays);

      const result = await resolver.publicTrays();

      expect(result).toEqual(mockPublicTrays);
      expect(mockTraysService.getPublicTrays).toHaveBeenCalled();
    });
  });

  describe('myTrayStats', () => {
    it('should return user tray statistics', async () => {
      const mockStats = {
        trayCount: 5,
        totalItems: 25,
        publicTrays: 2,
      };

      mockTraysService.getTrayStats.mockResolvedValue(mockStats);

      const result = await resolver.myTrayStats(mockUser);

      expect(result).toEqual(mockStats);
      expect(mockTraysService.getTrayStats).toHaveBeenCalledWith(mockUser.userId);
    });
  });
});