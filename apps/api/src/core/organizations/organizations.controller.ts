import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '@thallesp/nestjs-better-auth';
import { OrgId } from '../../common/decorators';
import { OrganizationsService } from './organizations.service';
import { SetSettingDto, UpdateOrganizationDto } from './dto';

@Controller('api/organization')
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get()
  current(@OrgId() organizationId: string) {
    return this.organizations.findById(organizationId);
  }

  @Patch()
  @Roles(['imperador', 'administrador'])
  update(@OrgId() organizationId: string, @Body() dto: UpdateOrganizationDto) {
    return this.organizations.update(organizationId, dto);
  }

  @Post('logo')
  @Roles(['imperador', 'administrador'])
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(
    @OrgId() organizationId: string,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size: number },
  ) {
    return this.organizations.setLogo(organizationId, file);
  }

  @Get('settings')
  settings(@OrgId() organizationId: string) {
    return this.organizations.getSettings(organizationId);
  }

  @Put('settings')
  @Roles(['imperador', 'administrador'])
  setSetting(@OrgId() organizationId: string, @Body() dto: SetSettingDto) {
    return this.organizations.setSetting(organizationId, dto.key, dto.value);
  }
}
