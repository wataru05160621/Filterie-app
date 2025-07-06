import { Module } from '@nestjs/common';
import { SourcesService } from './sources.service';
import { SourcesResolver } from './sources.resolver';
import { PrismaModule } from '../../prisma/prisma.module';
import { PubSubModule } from '../pubsub/pubsub.module';

@Module({
  imports: [PrismaModule, PubSubModule],
  providers: [SourcesResolver, SourcesService],
  exports: [SourcesService],
})
export class SourcesModule {}