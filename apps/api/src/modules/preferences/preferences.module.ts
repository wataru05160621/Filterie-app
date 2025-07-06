import { Module } from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { PreferencesResolver } from './preferences.resolver';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PreferencesService, PreferencesResolver],
  exports: [PreferencesService],
})
export class PreferencesModule {}