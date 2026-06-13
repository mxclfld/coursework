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
import { WorkRecordsService } from './work-records.service';
import {
  CreateWorkRecordDto,
  UpdateWorkRecordDto,
  WorkRecordQueryDto,
} from './dto/work-record.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('work-records')
@ApiBearerAuth()
@Controller('work-records')
export class WorkRecordsController {
  constructor(private readonly service: WorkRecordsService) {}

  @Get()
  @Roles(UserRole.AGRONOMIST, UserRole.FARM_MANAGER)
  findAll(@Query() query: WorkRecordQueryDto & PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.AGRONOMIST, UserRole.FARM_MANAGER)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(UserRole.AGRONOMIST)
  create(
    @Body() dto: CreateWorkRecordDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.AGRONOMIST)
  update(@Param('id') id: string, @Body() dto: UpdateWorkRecordDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.AGRONOMIST)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
