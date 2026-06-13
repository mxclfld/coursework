import { Module } from '@nestjs/common';
import { HarvestStockController } from './harvest-stock.controller';
import { HarvestStockService } from './harvest-stock.service';

@Module({
  controllers: [HarvestStockController],
  providers: [HarvestStockService],
  exports: [HarvestStockService],
})
export class HarvestStockModule {}
