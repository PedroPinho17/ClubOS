import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '@thallesp/nestjs-better-auth';
import { CurrentUser, OrgId, RequireModule } from '../../common/decorators';
import { ModuleGuard } from '../../common/guards/module.guard';
import type { AuthUser } from '../../common/types';
import { AuditService } from '../../core/audit/audit.service';
import { CreateMemberDto, UpdateMemberDto } from './dto';
import { MembersService } from './members.service';

@Controller('api/members')
@RequireModule('members')
@UseGuards(ModuleGuard)
export class MembersController {
  constructor(
    private readonly members: MembersService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  list(@OrgId() organizationId: string, @Query('search') search?: string) {
    return this.members.list(organizationId, search);
  }

  @Get(':id')
  findOne(@OrgId() organizationId: string, @Param('id') id: string) {
    return this.members.findOne(organizationId, id);
  }

  @Post()
  @Roles(['imperador', 'administrador'])
  async create(
    @OrgId() organizationId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateMemberDto,
  ) {
    const member = await this.members.create(organizationId, dto);
    await this.audit.log({
      organizationId,
      userId: user.id,
      action: 'member.created',
      entity: 'Member',
      entityId: member.id,
    });
    return member;
  }

  @Post(':id/photo')
  @Roles(['imperador', 'administrador'])
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @OrgId() organizationId: string,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size: number },
  ) {
    const member = await this.members.setPhoto(organizationId, id, file);
    await this.audit.log({
      organizationId,
      userId: user.id,
      action: 'member.photo_updated',
      entity: 'Member',
      entityId: id,
    });
    return member;
  }

  @Patch(':id')
  @Roles(['imperador', 'administrador'])
  async update(
    @OrgId() organizationId: string,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    const member = await this.members.update(organizationId, id, dto);
    await this.audit.log({
      organizationId,
      userId: user.id,
      action: 'member.updated',
      entity: 'Member',
      entityId: id,
    });
    return member;
  }

  @Delete(':id')
  @Roles(['imperador', 'administrador'])
  async remove(
    @OrgId() organizationId: string,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    const result = await this.members.remove(organizationId, id);
    await this.audit.log({
      organizationId,
      userId: user.id,
      action: 'member.deleted',
      entity: 'Member',
      entityId: id,
    });
    return result;
  }
}
