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
import { FertilizerPurchasesService } from './fertilizer-purchases.service';
import {
  CreateFertilizerPurchaseDto,
  FertilizerPurchaseQueryDto,
  UpdateFertilizerPurchaseDto,
  UpdatePaymentStatusDto,
} from './dto/fertilizer-purchase.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('fertilizer-purchases')
@ApiBearerAuth()
@Controller('fertilizer-purchases')
export class FertilizerPurchasesController {
  constructor(private readonly service: FertilizerPurchasesService) {}

  @Get()
  @Roles(UserRole.SALES_MANAGER, UserRole.FARM_MANAGER)
  findAll(@Query() query: FertilizerPurchaseQueryDto & PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SALES_MANAGER, UserRole.FARM_MANAGER)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(UserRole.SALES_MANAGER)
  create(
    @Body() dto: CreateFertilizerPurchaseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.SALES_MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateFertilizerPurchaseDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/payment-status')
  @Roles(UserRole.SALES_MANAGER)
  updatePaymentStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    return this.service.updatePaymentStatus(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SALES_MANAGER)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
