import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAgriculturalWorkDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateAgriculturalWorkDto extends PartialType(CreateAgriculturalWorkDto) {}

export class AgriculturalWorkQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
