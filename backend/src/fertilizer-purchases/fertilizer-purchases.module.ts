import { Module } from '@nestjs/common';
import { FertilizerPurchasesController } from './fertilizer-purchases.controller';
import { FertilizerPurchasesService } from './fertilizer-purchases.service';

@Module({
  controllers: [FertilizerPurchasesController],
  providers: [FertilizerPurchasesService],
  exports: [FertilizerPurchasesService],
})
export class FertilizerPurchasesModule {}
