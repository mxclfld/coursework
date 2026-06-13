import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HarvestStockService } from './harvest-stock.service';
import {
  AdjustHarvestStockDto,
  CreateHarvestStockDto,
  HarvestStockQueryDto,
  UpdateHarvestStockDto,
} from './dto/harvest-stock.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('harvest-stock')
@ApiBearerAuth()
@Controller('harvest-stock')
export class HarvestStockController {
  constructor(private readonly service: HarvestStockService) {}

  @Get()
  @Roles(UserRole.AGRONOMIST, UserRole.SALES_MANAGER, UserRole.FARM_MANAGER)
  findAll(@Query() query: HarvestStockQueryDto & PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.AGRONOMIST, UserRole.SALES_MANAGER, UserRole.FARM_MANAGER)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(UserRole.AGRONOMIST, UserRole.SALES_MANAGER)
  create(@Body() dto: CreateHarvestStockDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.AGRONOMIST, UserRole.SALES_MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateHarvestStockDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/adjust')
  @Roles(UserRole.SALES_MANAGER)
  @ApiOperation({ summary: 'Adjust available harvest stock balance' })
  adjust(@Param('id') id: string, @Body() dto: AdjustHarvestStockDto) {
    return this.service.adjust(id, dto);
  }
}
