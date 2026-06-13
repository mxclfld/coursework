import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PlantingStatus } from '../../common/enums';

export class ReportDateRangeDto {
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}

export class PlantingReportQueryDto extends ReportDateRangeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  fieldId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  cropId?: string;

  @ApiPropertyOptional({ enum: PlantingStatus })
  @IsOptional()
  @IsEnum(PlantingStatus)
  status?: PlantingStatus;
}

export class WorkSummaryReportQueryDto extends ReportDateRangeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  fieldId?: string;
}

export class MachineryUsageReportQueryDto extends ReportDateRangeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  machineryId?: string;
}

export class PurchaseReportQueryDto extends ReportDateRangeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  supplierId?: string;
}

export class SalesReportQueryDto extends ReportDateRangeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  buyerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  cropId?: string;
}

export class HarvestReportQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  cropId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  fieldId?: string;
}

export class FinancialReportQueryDto extends ReportDateRangeDto {}

export class DashboardQueryDto {
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}
