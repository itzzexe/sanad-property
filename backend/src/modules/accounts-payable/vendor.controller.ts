import { Controller, Get, Post, Body, Param, Query, Patch, UseGuards } from '@nestjs/common';
import { ApService } from './ap.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('ap/vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'ACCOUNTANT', 'OWNER')
export class VendorController {
  constructor(private readonly apService: ApService) {}

  @Post()
  create(@Body() dto: CreateVendorDto) {
    return this.apService.createVendor(dto);
  }

  @Get()
  findAll(@Query('isActive') isActive?: string) {
    return this.apService.findAllVendors({ isActive });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.apService.findOneVendor(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVendorDto) {
    return this.apService.updateVendor(id, dto);
  }
}
