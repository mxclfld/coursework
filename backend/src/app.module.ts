import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FieldsModule } from './fields/fields.module';
import { CropsModule } from './crops/crops.module';
import { PlantingsModule } from './plantings/plantings.module';
import { AgriculturalWorksModule } from './agricultural-works/agricultural-works.module';
import { WorkRecordsModule } from './work-records/work-records.module';
import { MachineryModule } from './machinery/machinery.module';
import { MachineryUsageModule } from './machinery-usage/machinery-usage.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { FertilizersModule } from './fertilizers/fertilizers.module';
import { FertilizerPurchasesModule } from './fertilizer-purchases/fertilizer-purchases.module';
import { BuyersModule } from './buyers/buyers.module';
import { SalesModule } from './sales/sales.module';
import { HarvestStockModule } from './harvest-stock/harvest-stock.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    FieldsModule,
    CropsModule,
    PlantingsModule,
    AgriculturalWorksModule,
    WorkRecordsModule,
    MachineryModule,
    MachineryUsageModule,
    SuppliersModule,
    FertilizersModule,
    FertilizerPurchasesModule,
    BuyersModule,
    SalesModule,
    HarvestStockModule,
    ReportsModule,
  ],
})
export class AppModule {}
