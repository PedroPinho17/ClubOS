import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser, ImperadorOnly, NoOrgContext } from '../../common/decorators';
import type { AuthUser } from '../../common/types';
import { CreateOrganizationDto } from './dto';
import { OrganizationsService } from './organizations.service';

@Controller('api/organizations')
@NoOrgContext()
export class OrganizationsListController {
  constructor(private readonly organizations: OrganizationsService) {}

  /** @deprecated Preferir GET /api/me/organizations (filtra por membership). */
  @Get()
  @ImperadorOnly()
  list() {
    return this.organizations.listAll();
  }

  /** Cria organizacao (imperador) + memberships. */
  @Post()
  @ImperadorOnly()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrganizationDto) {
    return this.organizations.create(dto, user.id);
  }
}
