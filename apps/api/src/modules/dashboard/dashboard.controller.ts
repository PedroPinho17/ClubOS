import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';
import { PaymentStatus } from '@clubos/database';
import { OrgId, RequireModule } from '../../common/decorators';
import { ModuleGuard } from '../../common/guards/module.guard';
import { STAFF_ROLES } from '../../common/roles';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('api/dashboard')
@RequireModule('dashboard')
@UseGuards(ModuleGuard)
@Roles([...STAFF_ROLES])
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  async stats(@OrgId() organizationId: string) {
    const [members, activeMembers, payments, revenue] = await Promise.all([
      this.prisma.member.count({ where: { organizationId } }),
      this.prisma.member.count({ where: { organizationId, status: 'ACTIVE' } }),
      this.prisma.payment.count({ where: { organizationId, status: PaymentStatus.PAID } }),
      this.prisma.payment.aggregate({
        where: { organizationId, status: PaymentStatus.PAID },
        _sum: { amount: true },
      }),
    ]);

    return {
      members,
      activeMembers,
      payments,
      revenue: Number(revenue._sum.amount ?? 0),
    };
  }
}
