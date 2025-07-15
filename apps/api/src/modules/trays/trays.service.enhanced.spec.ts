import { Test, TestingModule } from '@nestjs/testing';
import { TraysService } from './trays.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

describe('TraysService - Enhanced Features', () => {
  let service: TraysService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
  };

  const mockTray = {
    id: 'tray-1',
    userId: mockUser.id,
    name: 'Tech Articles',
    description: 'Collection of tech articles',
    isPublic: false,
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
  };

  const mockTrayItems = [
    {
      id: 'item-1',
      trayId: mockTray.id,
      articleId: 'article-1',
      position: 0,
      note: 'Important article about AI',
      addedAt: new Date('2025-01-15T09:00:00Z'),
      article: {
        id: 'article-1',
        title: 'AI Revolution in 2025',
        content: 'AI is changing the world...',
        url: 'https://example.com/ai-revolution',
        publishedAt: new Date('2025-01-15'),
        source: { name: 'Tech News' },
      },
    },
    {
      id: 'item-2',
      trayId: mockTray.id,
      articleId: 'article-2',
      position: 1,
      note: null,
      addedAt: new Date('2025-01-14T10:00:00Z'),
      article: {
        id: 'article-2',
        title: 'Quantum Computing Breakthrough',
        content: 'Scientists achieve new milestone...',
        url: 'https://example.com/quantum-breakthrough',
        publishedAt: new Date('2025-01-14'),
        source: { name: 'Science Daily' },
      },
    },
    {
      id: 'item-3',
      trayId: mockTray.id,
      articleId: 'article-3',
      position: 2,
      note: 'Review later',
      addedAt: new Date('2025-01-13T08:00:00Z'),
      article: {
        id: 'article-3',
        title: 'Web Development Best Practices',
        content: 'Modern web development requires...',
        url: 'https://example.com/web-best-practices',
        publishedAt: new Date('2025-01-13'),
        source: { name: 'Dev Blog' },
      },
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TraysService,
        {
          provide: PrismaService,
          useValue: {
            tray: {
              findUnique: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
            },
            trayItem: {
              findMany: jest.fn(),
              updateMany: jest.fn(),
              update: jest.fn(),
              deleteMany: jest.fn(),
              create: jest.fn(),
              createMany: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TraysService>(TraysService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Drag & Drop Reordering', () => {
    it('should reorder tray items by position', async () => {
      const trayWithItems = { ...mockTray, items: mockTrayItems };
      const reorderInput = {
        itemId: 'item-3',
        newPosition: 0,
      };

      (prismaService as any).tray.findUnique.mockResolvedValue(trayWithItems);
      (prismaService as any).$transaction.mockImplementation(async (callback: any) => {
        return callback(prismaService);
      });
      (prismaService as any).trayItem.updateMany.mockResolvedValue({ count: 2 });
      (prismaService as any).trayItem.update.mockResolvedValue({
        ...mockTrayItems[2],
        position: 0,
      });

      await service.reorderTrayItems(mockTray.id, mockUser.id, reorderInput);

      expect(prismaService.$transaction).toHaveBeenCalled();
      expect((prismaService as any).trayItem.updateMany).toHaveBeenCalledWith({
        where: {
          trayId: mockTray.id,
          position: { gte: 0, lt: 2 },
        },
        data: {
          position: { increment: 1 },
        },
      });
      expect((prismaService as any).trayItem.update).toHaveBeenCalledWith({
        where: { id: 'item-3' },
        data: { position: 0 },
      });
    });

    it('should handle moving items down in position', async () => {
      const trayWithItems = { ...mockTray, items: mockTrayItems };
      const reorderInput = {
        itemId: 'item-1',
        newPosition: 2,
      };

      (prismaService as any).tray.findUnique.mockResolvedValue(trayWithItems);
      (prismaService as any).$transaction.mockImplementation(async (callback: any) => {
        return callback(prismaService);
      });

      await service.reorderTrayItems(mockTray.id, mockUser.id, reorderInput);

      expect((prismaService as any).trayItem.updateMany).toHaveBeenCalledWith({
        where: {
          trayId: mockTray.id,
          position: { gt: 0, lte: 2 },
        },
        data: {
          position: { decrement: 1 },
        },
      });
    });

    it('should throw error if user does not own the tray', async () => {
      const otherUserTray = { ...mockTray, userId: 'other-user' };
      (prismaService as any).tray.findUnique.mockResolvedValue(otherUserTray);

      await expect(
        service.reorderTrayItems(mockTray.id, mockUser.id, { itemId: 'item-1', newPosition: 1 })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Export Functionality', () => {
    describe('Markdown Export', () => {
      it('should export tray items as Markdown', async () => {
        const trayWithItems = { ...mockTray, items: mockTrayItems };
        (prismaService as any).tray.findUnique.mockResolvedValue(trayWithItems);

        const markdown = await service.exportToMarkdown(mockTray.id, mockUser.id);

        expect(markdown).toContain('# Tech Articles');
        expect(markdown).toContain('Collection of tech articles');
        expect(markdown).toContain('## AI Revolution in 2025');
        expect(markdown).toContain('[Tech News](https://example.com/ai-revolution)');
        expect(markdown).toContain('> Important article about AI');
        expect(markdown).toContain('---');
      });

      it('should handle tray without description', async () => {
        const trayWithoutDesc = { ...mockTray, description: null, items: mockTrayItems };
        (prismaService as any).tray.findUnique.mockResolvedValue(trayWithoutDesc);

        const markdown = await service.exportToMarkdown(mockTray.id, mockUser.id);

        expect(markdown).toContain('# Tech Articles');
        expect(markdown).not.toContain('Collection of tech articles');
      });
    });

    describe('PDF Export', () => {
      it('should export tray items as PDF buffer', async () => {
        const trayWithItems = { ...mockTray, items: mockTrayItems };
        (prismaService as any).tray.findUnique.mockResolvedValue(trayWithItems);

        const pdfBuffer = await service.exportToPDF(mockTray.id, mockUser.id);

        expect(pdfBuffer).toBeInstanceOf(Buffer);
        expect(pdfBuffer.length).toBeGreaterThan(0);
      });

      it('should include metadata in PDF', async () => {
        const trayWithItems = { ...mockTray, items: mockTrayItems };
        (prismaService as any).tray.findUnique.mockResolvedValue(trayWithItems);
        (prismaService as any).user.findUnique.mockResolvedValue(mockUser);

        const metadata = await service.getPDFMetadata(mockTray.id, mockUser.id);

        expect(metadata).toEqual({
          title: 'Tech Articles',
          author: mockUser.name,
          subject: 'Collection of tech articles',
          creator: 'Filterie Export',
          creationDate: expect.any(Date),
        });
      });
    });

    describe('CSV Export', () => {
      it('should export tray items as CSV', async () => {
        const trayWithItems = { ...mockTray, items: mockTrayItems };
        (prismaService as any).tray.findUnique.mockResolvedValue(trayWithItems);

        const csv = await service.exportToCSV(mockTray.id, mockUser.id);

        expect(csv).toContain('"Position","Title","URL","Source","Published Date","Added Date","Note"');
        expect(csv).toContain('"1","AI Revolution in 2025","https://example.com/ai-revolution"');
        expect(csv).toContain('"Important article about AI"');
        expect(csv).toContain('"3","Web Development Best Practices"');
      });

      it('should escape special characters in CSV', async () => {
        const itemWithSpecialChars = {
          ...mockTrayItems[0],
          article: {
            ...mockTrayItems[0]!.article,
            title: 'Article with "quotes" and, commas',
          },
          note: 'Note with\nnewline',
        };
        const trayWithSpecialItems = { ...mockTray, items: [itemWithSpecialChars] };
        (prismaService as any).tray.findUnique.mockResolvedValue(trayWithSpecialItems);

        const csv = await service.exportToCSV(mockTray.id, mockUser.id);

        expect(csv).toContain('"Article with ""quotes"" and, commas"');
        expect(csv).toContain('"Note with\nnewline"');
      });
    });

    describe('HTML Export', () => {
      it('should export tray items as HTML', async () => {
        const trayWithItems = { ...mockTray, items: mockTrayItems };
        (prismaService as any).tray.findUnique.mockResolvedValue(trayWithItems);

        const html = await service.exportToHTML(mockTray.id, mockUser.id);

        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<title>Tech Articles - Filterie Export</title>');
        expect(html).toContain('<h1>Tech Articles</h1>');
        expect(html).toContain('<p>Collection of tech articles</p>');
        expect(html).toContain('<h2>AI Revolution in 2025</h2>');
        expect(html).toContain('<a href="https://example.com/ai-revolution"');
        expect(html).toContain('<blockquote>Important article about AI</blockquote>');
      });
    });

    describe('OPML Export', () => {
      it('should export tray items as OPML for RSS readers', async () => {
        const trayWithItems = { ...mockTray, items: mockTrayItems };
        (prismaService as any).tray.findUnique.mockResolvedValue(trayWithItems);

        const opml = await service.exportToOPML(mockTray.id, mockUser.id);

        expect(opml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(opml).toContain('<opml version="2.0">');
        expect(opml).toContain('<title>Tech Articles</title>');
        expect(opml).toContain('<outline text="AI Revolution in 2025"');
        expect(opml).toContain('htmlUrl="https://example.com/ai-revolution"');
      });
    });
  });

  describe('Bulk Operations', () => {
    it('should add multiple articles to tray at once', async () => {
      const articleIds = ['article-4', 'article-5', 'article-6'];
      const existingItemCount = 3;

      (prismaService as any).tray.findUnique.mockResolvedValue(mockTray);
      (prismaService as any).trayItem.findMany.mockResolvedValue(mockTrayItems);
      (prismaService as any).$transaction.mockImplementation(async (operations: any[]) => {
        return operations.map((_, index) => ({
          id: `item-${existingItemCount + index + 1}`,
          position: existingItemCount + index,
        }));
      });

      const result = await service.bulkAddItems(mockTray.id, mockUser.id, { articleIds });

      expect(result.added).toBe(3);
      expect(result.skipped).toBe(0);
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should skip duplicate articles when bulk adding', async () => {
      const articleIds = ['article-1', 'article-4', 'article-5']; // article-1 already exists

      (prismaService as any).tray.findUnique.mockResolvedValue(mockTray);
      (prismaService as any).trayItem.findMany.mockResolvedValue(mockTrayItems);
      (prismaService as any).$transaction.mockImplementation(async (operations: any[]) => {
        return operations.map((_, index) => ({
          id: `item-${4 + index}`,
          position: 3 + index,
        }));
      });

      const result = await service.bulkAddItems(mockTray.id, mockUser.id, { articleIds });

      expect(result.added).toBe(2);
      expect(result.skipped).toBe(1);
    });

    it('should remove multiple items from tray', async () => {
      const itemIds = ['item-1', 'item-3'];

      (prismaService as any).tray.findUnique.mockResolvedValue(mockTray);
      (prismaService as any).trayItem.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.bulkRemoveItems(mockTray.id, mockUser.id, { itemIds });

      expect(result.removed).toBe(2);
      expect((prismaService as any).trayItem.deleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: itemIds },
          trayId: mockTray.id,
        },
      });
    });

    it('should duplicate a tray with all items', async () => {
      const trayWithItems = { ...mockTray, items: mockTrayItems };

      (prismaService as any).tray.findUnique.mockResolvedValue(trayWithItems);
      (prismaService as any).$transaction.mockImplementation(async () => {
        const newTray = {
          ...mockTray,
          id: 'tray-2',
          name: 'Tech Articles (Copy)',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return { ...newTray, items: mockTrayItems.length };
      });

      const result = await service.duplicateTray(mockTray.id, mockUser.id);

      expect(result.id).toBe('tray-2');
      expect(result.name).toBe('Tech Articles (Copy)');
      expect(result.items).toBe(3);
    });
  });
});