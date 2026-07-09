import { Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AdminOnly, CurrentUser, OrgId, PortalOnly, RequireModule } from '../../common/decorators';
import type { AuthUser } from '../../common/types';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PortalService } from './portal.service';

@Controller('api/portal')
@RequireModule('member-portal')
@UseGuards(ModuleGuard)
export class PortalController {
  constructor(private readonly portal: PortalService) {}

  @Get('me')
  @PortalOnly()
  me(@CurrentUser() user: AuthUser) {
    return this.portal.getMe(user.id);
  }

  @Get('payments/:id/receipt')
  @PortalOnly()
  async receipt(@CurrentUser() user: AuthUser, @Param('id') id: string, @Res() res: Response) {
    const { filename, buffer } = await this.portal.getReceipt(user.id, id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.end(buffer);
  }

  @Post('access/:memberId')
  @AdminOnly()
  grant(@OrgId() organizationId: string, @Param('memberId') memberId: string) {
    return this.portal.grantAccess(organizationId, memberId);
  }
}
