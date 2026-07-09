/**
 * @module MembersService
 * CRUD de socios, fotos e calculo de situacao de quota por organizacao.
 * Import/export Excel delegado a `MemberImportService` / `MemberExportService`.
 */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PaymentStatus } from '@clubos/database';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { CreateMemberDto, UpdateMemberDto } from './dto';
import { computeQuotaSituation } from './quota.util';
import { loadOrgReminderSettings } from '../reminders/org-reminder-settings';

const IMAGE_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async list(organizationId: string, search?: string) {
    const where: Prisma.MemberWhereInput = {
      organizationId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { number: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const members = await this.prisma.member.findMany({
      where,
      include: {
        quotaPlan: true,
        payments: {
          where: { status: PaymentStatus.PAID },
          orderBy: { paidAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const { diasAvisoQuota } = await loadOrgReminderSettings(this.prisma, organizationId);

    return Promise.all(
      members.map(async ({ payments, ...member }) => ({
        ...member,
        photoUrl: await this.storage.getUrl(member.photoKey),
        quotaSituation: computeQuotaSituation({
          periodicity: member.quotaPlan?.periodicity,
          joinedAt: member.joinedAt,
          lastPaidAt: payments[0]?.paidAt ?? null,
          cardValidUntil: member.cardValidUntil,
          dueSoonDays: diasAvisoQuota,
        }),
      })),
    );
  }

  async findOne(organizationId: string, id: string) {
    const member = await this.prisma.member.findFirst({
      where: { id, organizationId },
      include: { quotaPlan: true, payments: { orderBy: { createdAt: 'desc' } } },
    });
    if (!member) {
      throw new NotFoundException('Membro nao encontrado.');
    }

    const { diasAvisoQuota } = await loadOrgReminderSettings(this.prisma, organizationId);
    const lastPaid = member.payments.find((p) => p.status === PaymentStatus.PAID && p.paidAt);
    return {
      ...member,
      photoUrl: await this.storage.getUrl(member.photoKey),
      quotaSituation: computeQuotaSituation({
        periodicity: member.quotaPlan?.periodicity,
        joinedAt: member.joinedAt,
        lastPaidAt: lastPaid?.paidAt ?? null,
        cardValidUntil: member.cardValidUntil,
        dueSoonDays: diasAvisoQuota,
      }),
    };
  }

  /** Guarda a foto do socio no S3/MinIO e atualiza o photoKey. */
  async setPhoto(
    organizationId: string,
    id: string,
    file: { buffer: Buffer; mimetype: string; size: number } | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('Ficheiro em falta.');
    }
    const ext = IMAGE_EXT[file.mimetype];
    if (!ext) {
      throw new BadRequestException('Formato invalido (usa PNG, JPG ou WEBP).');
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException('Imagem demasiado grande (max 5MB).');
    }
    await this.findOne(organizationId, id);
    const key = `${organizationId}/members/${id}/photo-${Date.now()}.${ext}`;
    await this.storage.upload(key, file.buffer, file.mimetype);
    await this.prisma.member.update({ where: { id }, data: { photoKey: key } });
    return this.findOne(organizationId, id);
  }

  async create(organizationId: string, dto: CreateMemberDto) {
    const number = dto.number ?? (await this.nextNumber(organizationId));
    return this.prisma.member.create({
      data: {
        organizationId,
        number,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        notes: dto.notes,
        quotaPlanId: dto.quotaPlanId,
      },
    });
  }

  async update(organizationId: string, id: string, dto: UpdateMemberDto) {
    await this.findOne(organizationId, id);
    const { quotaPlanId, ...rest } = dto;
    return this.prisma.member.update({
      where: { id },
      data: {
        ...rest,
        ...(quotaPlanId !== undefined ? { quotaPlanId: quotaPlanId || null } : {}),
      },
    });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    await this.prisma.member.delete({ where: { id } });
    return { success: true };
  }

  private async nextNumber(organizationId: string): Promise<string> {
    const members = await this.prisma.member.findMany({
      where: { organizationId },
      select: { number: true },
    });
    const max = members.reduce((acc, m) => {
      const n = Number.parseInt(m.number, 10);
      return Number.isFinite(n) && n > acc ? n : acc;
    }, 0);
    return String(max + 1);
  }
}
