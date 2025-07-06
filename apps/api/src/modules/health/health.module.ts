import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HelloController } from './hello.controller';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController, HelloController],
})
export class HealthModule {}