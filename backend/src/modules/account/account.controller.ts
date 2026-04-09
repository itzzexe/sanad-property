import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, AccountType } from '@prisma/client';

@ApiTags('accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  @ApiOperation({ summary: 'List all accounts' })
  @ApiQuery({ name: 'type', enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'], required: false })
  @ApiQuery({ name: 'isActive', type: Boolean, required: false })
  async findAll(
    @Query('type') type?: AccountType,
    @Query('isActive') isActive?: string,
  ) {
    return this.accountService.findAll({
      type,
      isActive: isActive === undefined ? undefined : isActive === 'true',
    });
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get account tree' })
  async findTree() {
    return this.accountService.findTree();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single account' })
  async findOne(@Param('id') id: string) {
    return this.accountService.findOne(id);
  }

  @Get(':id/ledger')
  @ApiOperation({ summary: 'Get account ledger (Stub)' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getLedger(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.accountService.getLedger(id, { startDate, endDate });
  }

  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @Post()
  @ApiOperation({ summary: 'Create account (Admin, Accountant)' })
  async create(@Body() dto: CreateAccountDto) {
    return this.accountService.create(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @Patch(':id')
  @ApiOperation({ summary: 'Update account (Admin, Accountant)' })
  async update(@Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.accountService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete account (Admin only)' })
  async remove(@Param('id') id: string) {
    return this.accountService.delete(id);
  }

  @Get(':id/suggest-child-code')
  @ApiOperation({ summary: 'Suggest next child code' })
  async suggestNextChildCode(@Param('id') id: string) {
    const nextCode = await this.accountService.suggestNextChildCode(id);
    return { code: nextCode };
  }
}
