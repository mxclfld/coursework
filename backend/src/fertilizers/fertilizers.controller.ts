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
import { FertilizersService } from './fertilizers.service';
import {
  CreateFertilizerDto,
  FertilizerQueryDto,
  UpdateFertilizerDto,
} from './dto/fertilizer.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('fertilizers')
@ApiBearerAuth()
@Controller('fertilizers')
export class FertilizersController {
  constructor(private readonly service: FertilizersService) {}

  @Get()
  @Roles(UserRole.SALES_MANAGER, UserRole.FARM_MANAGER)
  findAll(@Query() query: FertilizerQueryDto & PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SALES_MANAGER, UserRole.FARM_MANAGER)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(UserRole.SALES_MANAGER)
  create(@Body() dto: CreateFertilizerDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.SALES_MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateFertilizerDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SALES_MANAGER)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
