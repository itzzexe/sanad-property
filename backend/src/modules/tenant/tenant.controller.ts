import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  create(@Body() dto: CreateTenantDto, @Req() req: any) {
    return this.tenantService.create(dto, req.user.sub);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import tenants from Excel file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(@UploadedFile() file: any, @Req() req: any) {
    if (!file) throw new BadRequestException('لم يتم رفع أي ملف');
    return this.tenantService.importExcel(file.buffer, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tenants' })
  findAll(@Query() query: any) {
    return this.tenantService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tenant by ID' })
  findOne(@Param('id') id: string) {
    return this.tenantService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a tenant' })
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto, @Req() req: any) {
    return this.tenantService.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tenant (soft delete)' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.tenantService.remove(id, req.user.sub);
  }
}
