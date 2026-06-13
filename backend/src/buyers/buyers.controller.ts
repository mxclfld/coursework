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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BuyersService } from './buyers.service';
import { BuyerQueryDto, CreateBuyerDto, UpdateBuyerDto } from './dto/buyer.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('buyers')
@ApiBearerAuth()
@Controller('buyers')
export class BuyersController {
  constructor(private readonly service: BuyersService) {}

  @Get()
  @Roles(UserRole.SALES_MANAGER, UserRole.FARM_MANAGER)
  findAll(@Query() query: BuyerQueryDto & PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SALES_MANAGER, UserRole.FARM_MANAGER)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(UserRole.SALES_MANAGER)
  create(@Body() dto: CreateBuyerDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.SALES_MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateBuyerDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SALES_MANAGER)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get(':id/sales')
  @Roles(UserRole.SALES_MANAGER, UserRole.FARM_MANAGER)
  @ApiOperation({ summary: 'Get sales to buyer' })
  getSales(@Param('id') id: string) {
    return this.service.getSales(id);
  }
}
