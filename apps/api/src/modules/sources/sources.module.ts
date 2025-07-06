import { Module } from '@nestjs/common';
import { SourcesService } from './sources.service';
import { SourcesResolver } from './sources.resolver';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SourcesResolver, SourcesService],
  exports: [SourcesService],
})
export class SourcesModule {}