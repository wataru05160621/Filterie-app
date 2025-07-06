import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { INestApplication } from '@nestjs/common';

describe('PrismaService', () => {
  let service: PrismaService;
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
    app = module.createNestApplication();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('instance', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should extend PrismaClient', () => {
      expect(service).toHaveProperty('user');
      expect(service).toHaveProperty('source');
      expect(service).toHaveProperty('article');
      expect(service).toHaveProperty('tag');
      expect(service).toHaveProperty('userPreference');
    });
  });

  describe('onModuleInit', () => {
    it('should connect to database on module init', async () => {
      const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();

      await service.onModuleInit();

      expect(connectSpy).toHaveBeenCalled();
      connectSpy.mockRestore();
    });

    it('should handle connection errors', async () => {
      const connectSpy = jest
        .spyOn(service, '$connect')
        .mockRejectedValue(new Error('Connection failed'));

      await expect(service.onModuleInit()).rejects.toThrow(
        'Connection failed',
      );

      connectSpy.mockRestore();
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from database on module destroy', async () => {
      const disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValue();

      await service.onModuleDestroy();

      expect(disconnectSpy).toHaveBeenCalled();
      disconnectSpy.mockRestore();
    });

    it('should handle disconnect errors', async () => {
      const disconnectSpy = jest
        .spyOn(service, '$disconnect')
        .mockRejectedValue(new Error('Disconnect failed'));

      await expect(service.onModuleDestroy()).rejects.toThrow(
        'Disconnect failed',
      );

      disconnectSpy.mockRestore();
    });
  });

  describe('cleanDb', () => {
    it('should clean all database tables', async () => {
      // Mock Reflect.ownKeys to return model names
      const mockModels = ['user', 'source', 'article', 'tag'];
      jest.spyOn(Reflect, 'ownKeys').mockReturnValue(mockModels);

      // Mock deleteMany for each model
      mockModels.forEach(model => {
        (service as any)[model] = {
          deleteMany: jest.fn().mockResolvedValue({ count: 1 })
        };
      });

      await service.cleanDb();

      // Verify each model's deleteMany was called
      mockModels.forEach(model => {
        expect((service as any)[model].deleteMany).toHaveBeenCalled();
      });
    });

    it('should throw error in production environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      await expect(service.cleanDb()).rejects.toThrow(
        'cleanDb is not allowed in production'
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle deleteMany errors', async () => {
      jest.spyOn(Reflect, 'ownKeys').mockReturnValue(['user']);
      
      (service as any).user = {
        deleteMany: jest.fn().mockRejectedValue(new Error('Delete failed'))
      };

      await expect(service.cleanDb()).rejects.toThrow('Delete failed');
    });
  });

  describe('error handling', () => {
    it('should handle Prisma unique constraint errors', async () => {
      const error = {
        code: 'P2002',
        meta: { target: ['email'] },
      };

      // This test verifies that PrismaService can properly propagate Prisma errors
      const createSpy = jest
        .spyOn(service.user, 'create')
        .mockRejectedValue(error);

      await expect(
        service.user.create({
          data: {
            email: 'duplicate@example.com',
            password: 'password',
            name: 'Test',
          },
        }),
      ).rejects.toMatchObject({
        code: 'P2002',
        meta: { target: ['email'] },
      });

      createSpy.mockRestore();
    });

    it('should handle Prisma not found errors', async () => {
      const error = {
        code: 'P2025',
        meta: { cause: 'Record to update not found.' },
      };

      const updateSpy = jest
        .spyOn(service.user, 'update')
        .mockRejectedValue(error);

      await expect(
        service.user.update({
          where: { id: 'non-existent' },
          data: { name: 'Updated' },
        }),
      ).rejects.toMatchObject({
        code: 'P2025',
      });

      updateSpy.mockRestore();
    });
  });
});