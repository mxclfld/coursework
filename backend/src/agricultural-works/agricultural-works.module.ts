import { Module } from '@nestjs/common';
import { AgriculturalWorksController } from './agricultural-works.controller';
import { AgriculturalWorksService } from './agricultural-works.service';

@Module({
  controllers: [AgriculturalWorksController],
  providers: [AgriculturalWorksService],
  exports: [AgriculturalWorksService],
})
export class AgriculturalWorksModule {}
