import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AdminOnly, CurrentUser, OrgId, RequireModule, StaffOnly } from '../../common/decorators';
import { ModuleGuard } from '../../common/guards/module.guard';
import type { AuthUser } from '../../common/types';
import { AuditService } from '../../core/audit/audit.service';
import { CreateMemberDto, GdprEraseDto, UpdateMemberDto } from './dto';
import { buildImportTemplateBuffer } from './import/member-spreadsheet';
import { MemberExportService } from './import/member-export.service';
import { MemberImportService } from './import/member-import.service';
import { MemberGdprService } from './member-gdpr.service';
import { MembersService } from './members.service';

@Controller('api/members')
@RequireModule('members')
@UseGuards(ModuleGuard)
export class MembersController {
  constructor(
    private readonly members: MembersService,
    private readonly memberImport: MemberImportService,
    private readonly memberExport: MemberExportService,
    private readonly memberGdpr: MemberGdprService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @StaffOnly()
  list(@OrgId() organizationId: string, @Query('search') search?: string) {
    return this.members.list(organizationId, search);
  }

  @Get('import/template')
  @AdminOnly()
  downloadImportTemplate(@Res() res: Response) {
    const buffer = buildImportTemplateBuffer();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="modelo_importacao_socios.xlsx"',
    });
    res.send(buffer);
  }

  @Get('export')
  @StaffOnly()
  async exportMembers(@OrgId() organizationId: string, @Res() res: Response) {
    const buffer = await this.memberExport.exportBuffer(organizationId);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${this.memberExport.exportFilename()}"`,
    });
    res.send(buffer);
  }

  @Post('import')
  @AdminOnly()
  @UseInterceptors(FileInterceptor('file'))
  async importSpreadsheet(
    @OrgId() organizationId: string,
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: { buffer: Buffer; size: number } | undefined,
    @Body('updateExisting') updateExisting?: string,
    @Body('dryRun') dryRun?: string,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Ficheiro em falta.');
    }
    const result = await this.memberImport.importFromBuffer(
      organizationId,
      file.buffer,
      updateExisting !== 'false',
      dryRun === 'true',
    );
    await this.audit.log({
      organizationId,
      userId: user.id,
      action: dryRun === 'true' ? 'member.import_dry_run' : 'member.imported',
      entity: 'Member',
      meta: {
        created: result.created,
        updated: result.updated,
        payments: result.payments,
        skipped: result.skipped,
        errors: result.errors.length,
      },
    });
    return result;
  }

  @Get(':id/gdpr-export')
  @AdminOnly()
  async gdprExport(
    @OrgId() organizationId: string,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const payload = await this.memberGdpr.buildExport(organizationId, id);
    await this.audit.log({
      organizationId,
      userId: user.id,
      action: 'member.gdpr_export',
      entity: 'Member',
      entityId: id,
    });
    const json = JSON.stringify(payload, null, 2);
    res.set({
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="gdpr-export-${id}.json"`,
    });
    res.send(json);
  }

  @Post(':id/gdpr-erase')
  @AdminOnly()
  async gdprErase(
    @OrgId() organizationId: string,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: GdprEraseDto,
  ) {
    if (!dto.confirm) {
      throw new BadRequestException('Confirme o pedido de apagamento (confirm: true).');
    }
    const result = await this.memberGdpr.erasePersonalData(organizationId, id);
    await this.audit.log({
      organizationId,
      userId: user.id,
      action: 'member.gdpr_erased',
      entity: 'Member',
      entityId: id,
      meta: { portalUserAnonymized: result.portalUserAnonymized },
    });
    return result;
  }

  @Get(':id')
  @StaffOnly()
  findOne(@OrgId() organizationId: string, @Param('id') id: string) {
    return this.members.findOne(organizationId, id);
  }

  @Post()
  @AdminOnly()
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
  @AdminOnly()
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
  @AdminOnly()
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
  @AdminOnly()
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
