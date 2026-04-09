import { Controller, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { FinanceExportService } from './finance-export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportParams } from '../reports/types/report-params';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceExportController {
  constructor(private readonly exportService: FinanceExportService) {}

  @Post(':reportType/export')
  @Roles('ADMIN', 'ACCOUNTANT', 'OWNER')
  async export(
    @Param('reportType') reportType: string,
    @Body() body: { format: 'pdf' | 'excel' } & ReportParams,
    @Request() req: any,
  ) {
    const { format, ...reportParams } = body;
    
    // Convert string dates to Date objects if needed
    if (reportParams.startDate) reportParams.startDate = new Date(reportParams.startDate);
    if (reportParams.endDate) reportParams.endDate = new Date(reportParams.endDate);

    return this.exportService.exportReport({
      reportType,
      format,
      reportParams,
      requestedBy: req.user.id,
    });
  }
}
