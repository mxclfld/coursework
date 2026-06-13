import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateMachineryUsageDto {
  @ApiProperty()
  @IsUUID()
  machineryId: string;

  @ApiProperty()
  @IsUUID()
  workRecordId: string;

  @ApiProperty({ type: String, format: 'date' })
  @Type(() => Date)
  @IsDate()
  usageDate: Date;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  operatingHours: number;
}

export class UpdateMachineryUsageDto extends PartialType(CreateMachineryUsageDto) {}

export class MachineryUsageQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  machineryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  workRecordId?: string;

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
