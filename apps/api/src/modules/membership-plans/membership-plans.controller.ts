import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';
import { OrgId, RequireModule } from '../../common/decorators';
import { ModuleGuard } from '../../common/guards/module.guard';
import { ADMIN_ROLES, STAFF_ROLES } from '../../common/roles';
import { CreateMembershipPlanDto, UpdateMembershipPlanDto } from './dto';
import { MembershipPlansService } from './membership-plans.service';

@Controller('api/membership-plans')
@RequireModule('membership-plans')
@UseGuards(ModuleGuard)
export class MembershipPlansController {
  constructor(private readonly plans: MembershipPlansService) {}

  @Get()
  @Roles([...STAFF_ROLES])
  list(@OrgId() organizationId: string) {
    return this.plans.list(organizationId);
  }

  @Get(':id')
  @Roles([...STAFF_ROLES])
  findOne(@OrgId() organizationId: string, @Param('id') id: string) {
    return this.plans.findOne(organizationId, id);
  }

  @Post()
  @Roles([...ADMIN_ROLES])
  create(@OrgId() organizationId: string, @Body() dto: CreateMembershipPlanDto) {
    return this.plans.create(organizationId, dto);
  }

  @Patch(':id')
  @Roles([...ADMIN_ROLES])
  update(
    @OrgId() organizationId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMembershipPlanDto,
  ) {
    return this.plans.update(organizationId, id, dto);
  }

  @Delete(':id')
  @Roles([...ADMIN_ROLES])
  remove(@OrgId() organizationId: string, @Param('id') id: string) {
    return this.plans.remove(organizationId, id);
  }
}
