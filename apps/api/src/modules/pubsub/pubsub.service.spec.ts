import { Test, TestingModule } from '@nestjs/testing';
import { PubSubService } from './pubsub.service';
import { PUB_SUB } from './pubsub.module';

describe('PubSubService', () => {
  let service: PubSubService;
  let pubSub: any;

  beforeEach(async () => {
    // モックのPubSubオブジェクトを作成
    pubSub = {
      publish: jest.fn().mockResolvedValue(undefined),
      asyncIterator: jest.fn().mockReturnValue({
        next: jest.fn(),
        return: jest.fn(),
        throw: jest.fn(),
        [Symbol.asyncIterator]: function() { return this; },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PubSubService,
        {
          provide: PUB_SUB,
          useValue: pubSub,
        },
      ],
    }).compile();

    service = module.get<PubSubService>(PubSubService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('publishArticleCreated', () => {
    it('should publish article created event', async () => {
      const article = {
        id: '1',
        title: 'Test Article',
        content: 'Test content',
        publishedAt: new Date(),
        sourceId: 'source-1',
      };

      await service.publishArticleCreated(article);

      expect(pubSub.publish).toHaveBeenCalledWith('articleCreated', {
        articleCreated: article,
      });
    });
  });

  describe('publishArticleUpdated', () => {
    it('should publish article updated event', async () => {
      const article = {
        id: '1',
        title: 'Updated Article',
        content: 'Updated content',
        publishedAt: new Date(),
        sourceId: 'source-1',
      };

      await service.publishArticleUpdated(article);

      expect(pubSub.publish).toHaveBeenCalledWith('articleUpdated', {
        articleUpdated: article,
      });
    });
  });

  describe('publishSourceStatusChanged', () => {
    it('should publish source status changed event', async () => {
      const sourceUpdate = {
        id: 'source-1',
        name: 'Test Source',
        status: 'active',
        lastCheckedAt: new Date(),
      };

      await service.publishSourceStatusChanged(sourceUpdate);

      expect(pubSub.publish).toHaveBeenCalledWith('sourceStatusChanged', {
        sourceStatusChanged: sourceUpdate,
      });
    });
  });

  describe('asyncIterator', () => {
    it('should return async iterator for single event', () => {
      const eventName = 'articleCreated';

      const iterator = service.asyncIterator(eventName);

      expect(pubSub.asyncIterator).toHaveBeenCalledWith(eventName);
      expect(iterator).toBeDefined();
    });

    it('should return async iterator for multiple events', () => {
      const events = ['articleCreated', 'articleUpdated'];

      const iterator = service.asyncIterator(events);

      expect(pubSub.asyncIterator).toHaveBeenCalledWith(events);
      expect(iterator).toBeDefined();
    });
  });
});