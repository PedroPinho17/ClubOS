import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { ImperadorOnly, OrgId, StaffOnly } from '../../common/decorators';
import { ModulesService } from './modules.service';

class ToggleModuleDto {
  @IsBoolean()
  enabled!: boolean;
}

@Controller('api/modules')
export class ModulesController {
  constructor(private readonly modules: ModulesService) {}

  @Get()
  @StaffOnly()
  list(@OrgId() organizationId: string) {
    return this.modules.listForOrganization(organizationId);
  }

  @Get('enabled')
  @StaffOnly()
  enabled(@OrgId() organizationId: string) {
    return this.modules.enabledSlugs(organizationId);
  }

  @Put(':slug')
  @ImperadorOnly()
  toggle(
    @OrgId() organizationId: string,
    @Param('slug') slug: string,
    @Body() dto: ToggleModuleDto,
  ) {
    return this.modules.setEnabled(organizationId, slug, dto.enabled);
  }
}
