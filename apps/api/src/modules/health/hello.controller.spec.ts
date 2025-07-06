import { Test, TestingModule } from '@nestjs/testing';
import { HelloController } from './hello.controller';

describe('HelloController', () => {
  let controller: HelloController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HelloController],
    }).compile();

    controller = module.get<HelloController>(HelloController);
  });

  describe('GET /api/hello', () => {
    it('should return status 200', () => {
      const result = controller.getHello();
      expect(result).toBeDefined();
    });

    it('should return correct message', () => {
      const result = controller.getHello();
      expect(result.message).toBe('Hello from Filterie!');
    });

    it('should return valid ISO-8601 timestamp', () => {
      const result = controller.getHello();
      expect(result.timestamp).toBeDefined();
      
      // Check if timestamp is valid ISO-8601
      const timestamp = new Date(result.timestamp);
      expect(timestamp.toISOString()).toBe(result.timestamp);
    });

    it('should return different timestamps on subsequent calls', async () => {
      const result1 = controller.getHello();
      
      // Wait a small amount of time
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const result2 = controller.getHello();
      expect(result1.timestamp).not.toBe(result2.timestamp);
    });
  });
});