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
import { AgriculturalWorksService } from './agricultural-works.service';
import {
  AgriculturalWorkQueryDto,
  CreateAgriculturalWorkDto,
  UpdateAgriculturalWorkDto,
} from './dto/agricultural-work.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('agricultural-works')
@ApiBearerAuth()
@Controller('agricultural-works')
export class AgriculturalWorksController {
  constructor(private readonly service: AgriculturalWorksService) {}

  @Get()
  @Roles(UserRole.AGRONOMIST, UserRole.FARM_MANAGER)
  findAll(@Query() query: AgriculturalWorkQueryDto & PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.AGRONOMIST, UserRole.FARM_MANAGER)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(UserRole.AGRONOMIST)
  create(@Body() dto: CreateAgriculturalWorkDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.AGRONOMIST)
  update(@Param('id') id: string, @Body() dto: UpdateAgriculturalWorkDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.AGRONOMIST)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
