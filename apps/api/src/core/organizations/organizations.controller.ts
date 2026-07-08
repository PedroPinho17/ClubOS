import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { Roles } from '@thallesp/nestjs-better-auth';
import { OrgId } from '../../common/decorators';
import { ADMIN_ROLES, STAFF_ROLES } from '../../common/roles';
import { OrganizationsService } from './organizations.service';
import { SetSettingDto, UpdateOrganizationDto } from './dto';

@Controller('api/organization')
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get()
  @Roles([...STAFF_ROLES])
  current(@OrgId() organizationId: string) {
    return this.organizations.findById(organizationId);
  }

  /** Logotipo binario (favicon / mesma origem via proxy do Next). */
  @Get('logo')
  @Roles([...STAFF_ROLES])
  async logo(@OrgId() organizationId: string, @Res() res: Response) {
    const { buffer, contentType } = await this.organizations.getLogoBuffer(organizationId);
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=300',
    });
    res.send(buffer);
  }

  @Patch()
  @Roles([...ADMIN_ROLES])
  update(@OrgId() organizationId: string, @Body() dto: UpdateOrganizationDto) {
    return this.organizations.update(organizationId, dto);
  }

  @Post('logo')
  @Roles([...ADMIN_ROLES])
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(
    @OrgId() organizationId: string,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size: number },
  ) {
    return this.organizations.setLogo(organizationId, file);
  }

  @Get('settings')
  @Roles([...STAFF_ROLES])
  settings(@OrgId() organizationId: string) {
    return this.organizations.getSettings(organizationId);
  }

  @Put('settings')
  @Roles([...ADMIN_ROLES])
  setSetting(@OrgId() organizationId: string, @Body() dto: SetSettingDto) {
    return this.organizations.setSetting(organizationId, dto.key, dto.value);
  }
}
