import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { PropertyService } from './property.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertyDto } from './dto/query-property.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('properties')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new property' })
  create(@Body() dto: CreatePropertyDto, @Req() req: any) {
    return this.propertyService.create(dto, req.user.sub);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import properties from Excel file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(@UploadedFile() file: any, @Req() req: any) {
    if (!file) throw new BadRequestException('لم يتم رفع أي ملف');
    return this.propertyService.importExcel(file.buffer, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all properties' })
  findAll(@Query() query: QueryPropertyDto, @Req() req: any) {
    return this.propertyService.findAll(query, req.user.sub, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a property by ID' })
  findOne(@Param('id') id: string) {
    return this.propertyService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a property' })
  update(@Param('id') id: string, @Body() dto: UpdatePropertyDto, @Req() req: any) {
    return this.propertyService.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a property (soft delete)' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.propertyService.remove(id, req.user.sub);
  }
}
