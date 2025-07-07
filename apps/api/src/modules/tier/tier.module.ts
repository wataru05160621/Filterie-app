import { Module } from '@nestjs/common';
import { TierClassifierService } from './tier-classifier.service';
import { TierResolver } from './tier.resolver';
import { PrismaModule } from '../../prisma/prisma.module';
import { TierSeedService } from './tier-seed.service';

@Module({
  imports: [PrismaModule],
  providers: [TierClassifierService, TierResolver, TierSeedService],
  exports: [TierClassifierService],
})
export class TierModule {}