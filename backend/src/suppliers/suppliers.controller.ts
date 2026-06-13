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
import { SuppliersService } from './suppliers.service';
import {
  CreateSupplierDto,
  SupplierQueryDto,
  UpdateSupplierDto,
} from './dto/supplier.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('suppliers')
@ApiBearerAuth()
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly service: SuppliersService) {}

  @Get()
  @Roles(UserRole.SALES_MANAGER, UserRole.FARM_MANAGER)
  findAll(@Query() query: SupplierQueryDto & PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SALES_MANAGER, UserRole.FARM_MANAGER)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(UserRole.SALES_MANAGER)
  create(@Body() dto: CreateSupplierDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.SALES_MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SALES_MANAGER)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get(':id/purchases')
  @Roles(UserRole.SALES_MANAGER, UserRole.FARM_MANAGER)
  @ApiOperation({ summary: 'Get purchases from supplier' })
  getPurchases(@Param('id') id: string) {
    return this.service.getPurchases(id);
  }
}
