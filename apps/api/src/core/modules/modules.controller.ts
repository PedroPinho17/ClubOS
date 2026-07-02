import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';
import { IsBoolean } from 'class-validator';
import { OrgId } from '../../common/decorators';
import { ModulesService } from './modules.service';

class ToggleModuleDto {
  @IsBoolean()
  enabled!: boolean;
}

@Controller('api/modules')
export class ModulesController {
  constructor(private readonly modules: ModulesService) {}

  @Get()
  list(@OrgId() organizationId: string) {
    return this.modules.listForOrganization(organizationId);
  }

  @Get('enabled')
  enabled(@OrgId() organizationId: string) {
    return this.modules.enabledSlugs(organizationId);
  }

  @Put(':slug')
  @Roles(['imperador', 'administrador'])
  toggle(
    @OrgId() organizationId: string,
    @Param('slug') slug: string,
    @Body() dto: ToggleModuleDto,
  ) {
    return this.modules.setEnabled(organizationId, slug, dto.enabled);
  }
}
