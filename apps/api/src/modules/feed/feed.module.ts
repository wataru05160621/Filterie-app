import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
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
  providers: [FeedService],
  exports: [FeedService],
})
export class FeedModule {}