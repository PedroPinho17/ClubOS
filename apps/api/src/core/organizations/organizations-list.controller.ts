import { Body, Controller, Get, Post } from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';
import { CurrentUser } from '../../common/decorators';
import type { AuthUser } from '../../common/types';
import { CreateOrganizationDto } from './dto';
import { OrganizationsService } from './organizations.service';

@Controller('api/organizations')
export class OrganizationsListController {
  constructor(private readonly organizations: OrganizationsService) {}

  /** @deprecated Preferir GET /api/me/organizations (filtra por membership). */
  @Get()
  @Roles(['imperador'])
  list() {
    return this.organizations.listAll();
  }

  /** Cria organizacao (imperador) + memberships. */
  @Post()
  @Roles(['imperador'])
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrganizationDto) {
    return this.organizations.create(dto, user.id);
  }
}
