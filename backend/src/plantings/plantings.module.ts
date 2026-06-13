import { Module } from '@nestjs/common';
import { PlantingsController } from './plantings.controller';
import { PlantingsService } from './plantings.service';

@Module({
  controllers: [PlantingsController],
  providers: [PlantingsService],
  exports: [PlantingsService],
})
export class PlantingsModule {}
