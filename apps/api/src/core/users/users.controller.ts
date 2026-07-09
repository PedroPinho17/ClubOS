import { Body, Controller, Get, Post } from '@nestjs/common';
import { AdminOnly, CurrentUser, OrgId } from '../../common/decorators';
import type { AuthUser } from '../../common/types';
import { InviteUserDto } from './dto';
import { UsersService } from './users.service';

@Controller('api/users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @AdminOnly()
  list(@OrgId() organizationId: string) {
    return this.users.listStaff(organizationId);
  }

  @Post('invite')
  @AdminOnly()
  invite(
    @OrgId() organizationId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: InviteUserDto,
  ) {
    return this.users.invite(organizationId, user.role, user.id, dto);
  }
}
