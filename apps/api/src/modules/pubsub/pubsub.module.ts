import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';
import { PubSubService } from './pubsub.service';

export const PUB_SUB = 'PUB_SUB';

@Global()
@Module({
  providers: [
    {
      provide: PUB_SUB,
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        
        if (!redisUrl) {
          // Redisが設定されていない場合は、インメモリPubSubを使用
          const { PubSub } = require('graphql-subscriptions');
          return new PubSub();
        }

        const options = {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
          password: configService.get<string>('REDIS_PASSWORD'),
          retryStrategy: (times: number) => Math.min(times * 50, 2000),
        };

        return new RedisPubSub({
          publisher: new Redis(options),
          subscriber: new Redis(options),
        });
      },
      inject: [ConfigService],
    },
    PubSubService,
  ],
  exports: [PUB_SUB, PubSubService],
})
export class PubSubModule {}