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
import { CreateMembershipPlanDto, UpdateMembershipPlanDto } from './dto';
import { MembershipPlansService } from './membership-plans.service';

@Controller('api/membership-plans')
@RequireModule('membership-plans')
@UseGuards(ModuleGuard)
export class MembershipPlansController {
  constructor(private readonly plans: MembershipPlansService) {}

  @Get()
  list(@OrgId() organizationId: string) {
    return this.plans.list(organizationId);
  }

  @Get(':id')
  findOne(@OrgId() organizationId: string, @Param('id') id: string) {
    return this.plans.findOne(organizationId, id);
  }

  @Post()
  @Roles(['imperador', 'administrador'])
  create(@OrgId() organizationId: string, @Body() dto: CreateMembershipPlanDto) {
    return this.plans.create(organizationId, dto);
  }

  @Patch(':id')
  @Roles(['imperador', 'administrador'])
  update(
    @OrgId() organizationId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMembershipPlanDto,
  ) {
    return this.plans.update(organizationId, id, dto);
  }

  @Delete(':id')
  @Roles(['imperador', 'administrador'])
  remove(@OrgId() organizationId: string, @Param('id') id: string) {
    return this.plans.remove(organizationId, id);
  }
}
