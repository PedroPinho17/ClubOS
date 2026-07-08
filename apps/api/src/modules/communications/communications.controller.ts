import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CommunicationAudience } from '@clubos/database';
import { Roles } from '@thallesp/nestjs-better-auth';
import { CurrentUser, OrgId, RequireModule } from '../../common/decorators';
import type { AuthUser } from '../../common/types';
import { ModuleGuard } from '../../common/guards/module.guard';
import { ADMIN_ROLES } from '../../common/roles';
import { CommunicationsService } from './communications.service';
import { CreateCommunicationDto, WhatsappLinksDto } from './dto';

@Controller('api/communications')
@RequireModule('communications')
@UseGuards(ModuleGuard)
@Roles([...ADMIN_ROLES])
export class CommunicationsController {
  constructor(private readonly communications: CommunicationsService) {}

  @Get()
  list(@OrgId() organizationId: string) {
    return this.communications.list(organizationId);
  }

  @Get('preview')
  preview(
    @OrgId() organizationId: string,
    @Query('audience') audience: CommunicationAudience,
    @Query('planId') planId?: string,
  ) {
    return this.communications.previewCount(organizationId, audience, planId);
  }

  @Get(':id')
  findOne(@OrgId() organizationId: string, @Param('id') id: string) {
    return this.communications.findOne(organizationId, id);
  }

  @Get('preview/whatsapp')
  previewWhatsapp(
    @OrgId() organizationId: string,
    @Query('audience') audience: CommunicationAudience,
    @Query('planId') planId?: string,
  ) {
    return this.communications.previewWhatsappCount(organizationId, audience, planId);
  }

  @Post('whatsapp')
  @Roles([...ADMIN_ROLES])
  whatsappLinks(@OrgId() organizationId: string, @Body() dto: WhatsappLinksDto) {
    return this.communications.generateWhatsappLinks(organizationId, dto);
  }

  @Post()
  @Roles([...ADMIN_ROLES])
  create(@OrgId() organizationId: string, @CurrentUser() user: AuthUser, @Body() dto: CreateCommunicationDto) {
    return this.communications.create(organizationId, user.id, dto);
  }
}
