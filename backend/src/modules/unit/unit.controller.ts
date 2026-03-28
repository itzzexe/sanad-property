import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UnitService } from './unit.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('units')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('units')
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new unit' })
  create(@Body() dto: CreateUnitDto) {
    return this.unitService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all units' })
  findAll(@Query() query: any) {
    return this.unitService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a unit by ID' })
  findOne(@Param('id') id: string) {
    return this.unitService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a unit' })
  update(@Param('id') id: string, @Body() dto: UpdateUnitDto) {
    return this.unitService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a unit (soft delete)' })
  remove(@Param('id') id: string) {
    return this.unitService.remove(id);
  }
}
