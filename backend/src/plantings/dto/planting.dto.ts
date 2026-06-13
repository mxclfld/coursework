import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { PlantingStatus } from '../../common/enums';

export class CreatePlantingDto {
  @ApiProperty()
  @IsUUID()
  fieldId: string;

  @ApiProperty()
  @IsUUID()
  cropId: string;

  @ApiProperty({ type: String, format: 'date' })
  @Type(() => Date)
  @IsDate()
  plantingDate: Date;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  plantedArea: number;

  @ApiPropertyOptional({ enum: PlantingStatus })
  @IsOptional()
  @IsEnum(PlantingStatus)
  status?: PlantingStatus;
}

export class UpdatePlantingDto extends PartialType(CreatePlantingDto) {}

export class UpdatePlantingStatusDto {
  @ApiProperty({ enum: PlantingStatus })
  @IsEnum(PlantingStatus)
  status: PlantingStatus;
}

export class PlantingQueryDto {
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
