import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LeaseService } from './lease.service';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('leases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leases')
export class LeaseController {
  constructor(private readonly leaseService: LeaseService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lease contract' })
  create(@Body() dto: CreateLeaseDto) {
    return this.leaseService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all leases' })
  findAll(@Query() query: any) {
    return this.leaseService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a lease by ID' })
  findOne(@Param('id') id: string) {
    return this.leaseService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a lease' })
  update(@Param('id') id: string, @Body() dto: UpdateLeaseDto) {
    return this.leaseService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Terminate a lease' })
  terminate(@Param('id') id: string) {
    return this.leaseService.terminate(id);
  }
}
