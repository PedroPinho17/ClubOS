import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMembershipPlanDto, UpdateMembershipPlanDto } from './dto';

@Injectable()
export class MembershipPlansService {
  constructor(private readonly prisma: PrismaService) {}

  list(organizationId: string) {
    return this.prisma.quotaPlan.findMany({
      where: { organizationId },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const plan = await this.prisma.quotaPlan.findFirst({
      where: { id, organizationId },
    });
    if (!plan) {
      throw new NotFoundException('Plano nao encontrado.');
    }
    return plan;
  }

  create(organizationId: string, dto: CreateMembershipPlanDto) {
    return this.prisma.quotaPlan.create({
      data: {
        organizationId,
        name: dto.name,
        amount: dto.amount,
        periodicity: dto.periodicity,
        active: dto.active ?? true,
      },
    });
  }

  async update(organizationId: string, id: string, dto: UpdateMembershipPlanDto) {
    await this.findOne(organizationId, id);
    return this.prisma.quotaPlan.update({ where: { id }, data: dto });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    // Nao apaga se houver socios associados (evita orfaos silenciosos).
    const members = await this.prisma.member.count({ where: { quotaPlanId: id } });
    if (members > 0) {
      // Desativa em vez de apagar.
      return this.prisma.quotaPlan.update({ where: { id }, data: { active: false } });
    }
    await this.prisma.quotaPlan.delete({ where: { id } });
    return { success: true };
  }
}
