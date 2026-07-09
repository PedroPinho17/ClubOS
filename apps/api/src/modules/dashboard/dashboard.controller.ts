import { Controller, Get, UseGuards } from '@nestjs/common';
import { OrgId, RequireModule, StaffOnly } from '../../common/decorators';
import { ModuleGuard } from '../../common/guards/module.guard';
import { DashboardService } from './dashboard.service';

@Controller('api/dashboard')
@RequireModule('dashboard')
@UseGuards(ModuleGuard)
@StaffOnly()
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('stats')
  stats(@OrgId() organizationId: string) {
    return this.dashboard.stats(organizationId);
  }
}
