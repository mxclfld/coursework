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
import { PlantingsService } from './plantings.service';
import {
  CreatePlantingDto,
  PlantingQueryDto,
  UpdatePlantingDto,
  UpdatePlantingStatusDto,
} from './dto/planting.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('plantings')
@ApiBearerAuth()
@Controller('plantings')
export class PlantingsController {
  constructor(private readonly plantingsService: PlantingsService) {}

  @Get()
  @Roles(UserRole.AGRONOMIST, UserRole.SALES_MANAGER, UserRole.FARM_MANAGER)
  findAll(@Query() query: PlantingQueryDto & PaginationQueryDto) {
    return this.plantingsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.AGRONOMIST, UserRole.SALES_MANAGER, UserRole.FARM_MANAGER)
  findOne(@Param('id') id: string) {
    return this.plantingsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.AGRONOMIST)
  create(
    @Body() dto: CreatePlantingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.plantingsService.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.AGRONOMIST)
  update(@Param('id') id: string, @Body() dto: UpdatePlantingDto) {
    return this.plantingsService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.AGRONOMIST)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePlantingStatusDto,
  ) {
    return this.plantingsService.updateStatus(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.AGRONOMIST)
  remove(@Param('id') id: string) {
    return this.plantingsService.remove(id);
  }
}
