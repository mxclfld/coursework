import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import {
  DashboardQueryDto,
  FinancialReportQueryDto,
  HarvestReportQueryDto,
  MachineryUsageReportQueryDto,
  PlantingReportQueryDto,
  PurchaseReportQueryDto,
  SalesReportQueryDto,
  WorkSummaryReportQueryDto,
} from './dto/report.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('plantings')
  @Roles(UserRole.AGRONOMIST, UserRole.FARM_MANAGER)
  plantings(@Query() query: PlantingReportQueryDto) {
    return this.service.getPlantingsReport(query);
  }

  @Get('work-summary')
  @Roles(UserRole.AGRONOMIST, UserRole.FARM_MANAGER)
  workSummary(@Query() query: WorkSummaryReportQueryDto) {
    return this.service.getWorkSummaryReport(query);
  }

  @Get('machinery-usage')
  @Roles(UserRole.AGRONOMIST, UserRole.FARM_MANAGER)
  machineryUsage(@Query() query: MachineryUsageReportQueryDto) {
    return this.service.getMachineryUsageReport(query);
  }

  @Get('purchases')
  @Roles(UserRole.SALES_MANAGER, UserRole.FARM_MANAGER)
  purchases(@Query() query: PurchaseReportQueryDto) {
    return this.service.getPurchasesReport(query);
  }

  @Get('sales')
  @Roles(UserRole.SALES_MANAGER, UserRole.FARM_MANAGER)
  sales(@Query() query: SalesReportQueryDto) {
    return this.service.getSalesReport(query);
  }

  @Get('financial')
  @Roles(UserRole.FARM_MANAGER)
  financial(@Query() query: FinancialReportQueryDto) {
    return this.service.getFinancialReport(query);
  }

  @Get('harvest')
  @Roles(UserRole.AGRONOMIST, UserRole.SALES_MANAGER, UserRole.FARM_MANAGER)
  harvest(@Query() query: HarvestReportQueryDto) {
    return this.service.getHarvestReport(query);
  }

  @Get('dashboard')
  @Roles(UserRole.AGRONOMIST, UserRole.SALES_MANAGER, UserRole.FARM_MANAGER)
  dashboard(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: DashboardQueryDto,
  ) {
    return this.service.getDashboard(user, query);
  }
}
