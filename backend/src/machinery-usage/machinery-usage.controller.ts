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
import { MachineryUsageService } from './machinery-usage.service';
import {
  CreateMachineryUsageDto,
  MachineryUsageQueryDto,
  UpdateMachineryUsageDto,
} from './dto/machinery-usage.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('machinery-usage')
@ApiBearerAuth()
@Controller('machinery-usage')
export class MachineryUsageController {
  constructor(private readonly service: MachineryUsageService) {}

  @Get()
  @Roles(UserRole.AGRONOMIST, UserRole.FARM_MANAGER)
  findAll(@Query() query: MachineryUsageQueryDto & PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.AGRONOMIST, UserRole.FARM_MANAGER)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(UserRole.AGRONOMIST)
  create(@Body() dto: CreateMachineryUsageDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.AGRONOMIST)
  update(@Param('id') id: string, @Body() dto: UpdateMachineryUsageDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.AGRONOMIST)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
