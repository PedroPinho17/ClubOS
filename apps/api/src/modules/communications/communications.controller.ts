import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CommunicationAudience } from '@clubos/database';
import { Roles } from '@thallesp/nestjs-better-auth';
import { CurrentUser, OrgId, RequireModule } from '../../common/decorators';
import type { AuthUser } from '../../common/types';
import { ModuleGuard } from '../../common/guards/module.guard';
import { CommunicationsService } from './communications.service';
import { CreateCommunicationDto } from './dto';

@Controller('api/communications')
@RequireModule('communications')
@UseGuards(ModuleGuard)
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

  @Post()
  @Roles(['imperador', 'administrador'])
  create(@OrgId() organizationId: string, @CurrentUser() user: AuthUser, @Body() dto: CreateCommunicationDto) {
    return this.communications.create(organizationId, user.id, dto);
  }
}
