import { Module } from '@nestjs/common';
import { MachineryUsageController } from './machinery-usage.controller';
import { MachineryUsageService } from './machinery-usage.service';

@Module({
  controllers: [MachineryUsageController],
  providers: [MachineryUsageService],
  exports: [MachineryUsageService],
})
export class MachineryUsageModule {}
