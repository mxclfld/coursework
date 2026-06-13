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
import { MachineryService } from './machinery.service';
import {
  CreateMachineryDto,
  MachineryQueryDto,
  UpdateMachineryDto,
  UpdateMachineryStatusDto,
} from './dto/machinery.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('machinery')
@ApiBearerAuth()
@Controller('machinery')
export class MachineryController {
  constructor(private readonly service: MachineryService) {}

  @Get()
  @Roles(UserRole.AGRONOMIST, UserRole.FARM_MANAGER)
  findAll(@Query() query: MachineryQueryDto & PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.AGRONOMIST, UserRole.FARM_MANAGER)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(UserRole.AGRONOMIST)
  create(@Body() dto: CreateMachineryDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.AGRONOMIST)
  update(@Param('id') id: string, @Body() dto: UpdateMachineryDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.AGRONOMIST)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateMachineryStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.AGRONOMIST)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get(':id/usage')
  @Roles(UserRole.AGRONOMIST, UserRole.FARM_MANAGER)
  @ApiOperation({ summary: 'Get machinery usage history' })
  getUsage(@Param('id') id: string) {
    return this.service.getUsageHistory(id);
  }
}
