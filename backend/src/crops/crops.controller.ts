import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CropsService } from './crops.service';
import { CreateCropDto, CropQueryDto, UpdateCropDto } from './dto/crop.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('crops')
@ApiBearerAuth()
@Controller('crops')
export class CropsController {
  constructor(private readonly cropsService: CropsService) {}

  @Get()
  @Roles(UserRole.AGRONOMIST, UserRole.SALES_MANAGER, UserRole.FARM_MANAGER)
  findAll(@Query() query: CropQueryDto & PaginationQueryDto) {
    return this.cropsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.AGRONOMIST, UserRole.SALES_MANAGER, UserRole.FARM_MANAGER)
  findOne(@Param('id') id: string) {
    return this.cropsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.AGRONOMIST)
  create(@Body() dto: CreateCropDto) {
    return this.cropsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.AGRONOMIST)
  update(@Param('id') id: string, @Body() dto: UpdateCropDto) {
    return this.cropsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.AGRONOMIST)
  remove(@Param('id') id: string) {
    return this.cropsService.remove(id);
  }
}
