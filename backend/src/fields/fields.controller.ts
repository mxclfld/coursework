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
import { FieldsService } from './fields.service';
import {
  CreateFieldDto,
  FieldQueryDto,
  UpdateFieldDto,
} from './dto/field.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('fields')
@ApiBearerAuth()
@Controller('fields')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Get()
  @Roles(UserRole.AGRONOMIST, UserRole.SALES_MANAGER, UserRole.FARM_MANAGER)
  findAll(@Query() query: FieldQueryDto & PaginationQueryDto) {
    return this.fieldsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.AGRONOMIST, UserRole.SALES_MANAGER, UserRole.FARM_MANAGER)
  findOne(@Param('id') id: string) {
    return this.fieldsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.AGRONOMIST)
  create(@Body() dto: CreateFieldDto) {
    return this.fieldsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.AGRONOMIST)
  update(@Param('id') id: string, @Body() dto: UpdateFieldDto) {
    return this.fieldsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.AGRONOMIST)
  remove(@Param('id') id: string) {
    return this.fieldsService.remove(id);
  }

  @Get(':id/plantings')
  @Roles(UserRole.AGRONOMIST, UserRole.SALES_MANAGER, UserRole.FARM_MANAGER)
  @ApiOperation({ summary: 'Get plantings for a field' })
  getPlantings(@Param('id') id: string) {
    return this.fieldsService.getPlantings(id);
  }

  @Get(':id/work-records')
  @Roles(UserRole.AGRONOMIST, UserRole.FARM_MANAGER)
  @ApiOperation({ summary: 'Get work records for a field' })
  getWorkRecords(@Param('id') id: string) {
    return this.fieldsService.getWorkRecords(id);
  }
}
