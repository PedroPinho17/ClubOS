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
import { OrgId, AdminOnly, RequireModule, StaffOnly } from '../../common/decorators';
import { ModuleGuard } from '../../common/guards/module.guard';
import { CreateMembershipPlanDto, UpdateMembershipPlanDto } from './dto';
import { MembershipPlansService } from './membership-plans.service';

@Controller('api/membership-plans')
@RequireModule('membership-plans')
@UseGuards(ModuleGuard)
export class MembershipPlansController {
  constructor(private readonly plans: MembershipPlansService) {}

  @Get()
  @StaffOnly()
  list(@OrgId() organizationId: string) {
    return this.plans.list(organizationId);
  }

  @Get(':id')
  @StaffOnly()
  findOne(@OrgId() organizationId: string, @Param('id') id: string) {
    return this.plans.findOne(organizationId, id);
  }

  @Post()
  @AdminOnly()
  create(@OrgId() organizationId: string, @Body() dto: CreateMembershipPlanDto) {
    return this.plans.create(organizationId, dto);
  }

  @Patch(':id')
  @AdminOnly()
  update(
    @OrgId() organizationId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMembershipPlanDto,
  ) {
    return this.plans.update(organizationId, id, dto);
  }

  @Delete(':id')
  @AdminOnly()
  remove(@OrgId() organizationId: string, @Param('id') id: string) {
    return this.plans.remove(organizationId, id);
  }
}
