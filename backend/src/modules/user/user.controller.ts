import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(UserRole.ADMIN)
  @Get()
  @ApiOperation({ summary: 'List all users (Admin only)' })
  async findAll() {
    return this.userService.findAll();
  }

  @Roles(UserRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Add a new user (Admin only)' })
  async create(@Body() dto: CreateUserDto, @Req() req: any) {
    return this.userService.create(dto, req.user.sub);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update user active status (Admin only)' })
  async updateStatus(@Param('id') id: string, @Body('isActive') isActive: boolean, @Req() req: any) {
    return this.userService.updateStatus(id, isActive, req.user.sub);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a user (Admin only)' })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.userService.remove(id, req.user.sub);
  }
}
