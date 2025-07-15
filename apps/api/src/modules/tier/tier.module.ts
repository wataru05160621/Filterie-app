import { Module } from '@nestjs/common';
import { TierClassifierService } from './tier-classifier.service';
import { TierResolver } from './tier.resolver';
import { PrismaModule } from '../../prisma/prisma.module';
import { TierSeedService } from './tier-seed.service';
import { SourcesModule } from '../sources/sources.module';

@Module({
  imports: [PrismaModule, SourcesModule],
  providers: [TierClassifierService, TierResolver, TierSeedService],
  exports: [TierClassifierService],
})
export class TierModule {}