import { Module } from '@nestjs/common';
import { AiSummaryService } from './ai-summary.service';
import { AiResolver } from './ai.resolver';
import { ArticlesModule } from '../articles/articles.module';

@Module({
  imports: [ArticlesModule],
  providers: [AiSummaryService, AiResolver],
  exports: [AiSummaryService],
})
export class AiModule {}