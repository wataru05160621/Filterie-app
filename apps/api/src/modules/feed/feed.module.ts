import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { FeedPollerService } from './feed-poller.service';
import { ArticlesModule } from '../articles/articles.module';
import { SourcesModule } from '../sources/sources.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PubSubModule } from '../pubsub/pubsub.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    PubSubModule,
    ArticlesModule,
    SourcesModule,
  ],
  controllers: [FeedController],
  providers: [FeedService, FeedPollerService],
  exports: [FeedService],
})
export class FeedModule {}