import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MachineryStatus } from '../../common/enums';

export class CreateMachineryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  inventoryNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  equipmentType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional({ enum: MachineryStatus })
  @IsOptional()
  @IsEnum(MachineryStatus)
  status?: MachineryStatus;
}

export class UpdateMachineryDto extends PartialType(CreateMachineryDto) {}

export class UpdateMachineryStatusDto {
  @ApiProperty({ enum: MachineryStatus })
  @IsEnum(MachineryStatus)
  status: MachineryStatus;
}

export class MachineryQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  equipmentType?: string;

  @ApiPropertyOptional({ enum: MachineryStatus })
  @IsOptional()
  @IsEnum(MachineryStatus)
  status?: MachineryStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
