import { Module } from '@nestjs/common';
import { AiSummaryService } from './ai-summary.service';
import { AiResolver } from './ai.resolver';
import { ArticlesModule } from '../articles/articles.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [ArticlesModule, PrismaModule],
  providers: [AiSummaryService, AiResolver],
  exports: [AiSummaryService],
})
export class AiModule {}