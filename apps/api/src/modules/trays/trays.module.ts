import { Module } from '@nestjs/common';
import { TraysService } from './trays.service';
import { TraysResolver } from './trays.resolver';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [TraysService, TraysResolver],
  exports: [TraysService],
})
export class TraysModule {}