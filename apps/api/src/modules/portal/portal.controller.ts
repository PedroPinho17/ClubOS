import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';
import { CurrentUser, OrgId, RequireModule } from '../../common/decorators';
import type { AuthUser } from '../../common/types';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PortalService } from './portal.service';

@Controller('api/portal')
@RequireModule('member-portal')
@UseGuards(ModuleGuard)
export class PortalController {
  constructor(private readonly portal: PortalService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.portal.getMe(user.id);
  }

  @Post('access/:memberId')
  @Roles(['imperador', 'administrador'])
  grant(@OrgId() organizationId: string, @Param('memberId') memberId: string) {
    return this.portal.grantAccess(organizationId, memberId);
  }
}
