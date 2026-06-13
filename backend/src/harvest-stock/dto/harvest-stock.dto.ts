import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateHarvestStockDto {
  @ApiProperty()
  @IsUUID()
  cropId: string;

  @ApiProperty()
  @IsUUID()
  fieldId: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalQuantity: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  availableBalance?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  unit: string;
}

export class UpdateHarvestStockDto extends PartialType(CreateHarvestStockDto) {}

export class AdjustHarvestStockDto {
  @ApiProperty({ description: 'Positive to add, negative to subtract' })
  @Type(() => Number)
  @IsNumber()
  adjustment: number;
}

export class HarvestStockQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  cropId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  fieldId?: string;
}
