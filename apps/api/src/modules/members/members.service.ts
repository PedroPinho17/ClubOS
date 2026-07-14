/**
 * @module MembersService
 * CRUD de socios, fotos e calculo de situacao de quota por organizacao.
 * Import/export Excel delegado a `MemberImportService` / `MemberExportService`.
 */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, PaymentStatus } from "@clubos/database";
import { PrismaService } from "../../prisma/prisma.service";
import { StorageService } from "../../storage/storage.service";
import { paginated, parsePagination } from "../../common/pagination";
import {
  parseApiDate,
  parseOptionalApiDate,
} from "../../common/parse-api-date";
import { CreateMemberDto, UpdateMemberDto } from "./dto";
import { computeQuotaSituation, type QuotaStatus } from "./quota.util";
import { loadOrgReminderSettings } from "../reminders/org-reminder-settings";

const IMAGE_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async list(
    organizationId: string,
    opts: {
      search?: string;
      page?: string;
      limit?: string;
      status?: string;
      quotaPlanId?: string;
      quotaStatus?: string;
    } = {},
  ) {
    const {
      search,
      page: pageRaw,
      limit: limitRaw,
      status,
      quotaPlanId,
      quotaStatus,
    } = opts;
    const { page, limit, skip } = parsePagination(
      { page: pageRaw, limit: limitRaw },
      { limit: 25, maxLimit: 500 },
    );

    const memberStatus =
      status === "ACTIVE" || status === "INACTIVE" ? status : undefined;
    const planFilter =
      quotaPlanId === "none"
        ? { quotaPlanId: null }
        : quotaPlanId
          ? { quotaPlanId }
          : {};
    const quotaFilter = this.parseQuotaStatusFilter(quotaStatus);

    const where: Prisma.MemberWhereInput = {
      organizationId,
      ...(memberStatus ? { status: memberStatus } : {}),
      ...planFilter,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { number: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const include = {
      quotaPlan: true,
      payments: {
        where: { status: PaymentStatus.PAID },
        orderBy: { paidAt: "desc" as const },
        take: 1,
      },
    };

    const { diasAvisoQuota } = await loadOrgReminderSettings(
      this.prisma,
      organizationId,
    );

    type MemberRow = Prisma.MemberGetPayload<{
      include: typeof include;
    }>;

    const mapMembers = async (rows: MemberRow[]) =>
      Promise.all(
        rows.map(async ({ payments, ...member }) => ({
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

    if (quotaFilter) {
      const members = await this.prisma.member.findMany({
        where,
        include,
        orderBy: { createdAt: "desc" },
      });
      const items = await mapMembers(members);
      const filtered = items.filter(
        (m) => m.quotaSituation.status === quotaFilter,
      );
      const pageItems = filtered.slice(skip, skip + limit);
      return paginated(pageItems, filtered.length, page, limit);
    }

    const [total, members] = await Promise.all([
      this.prisma.member.count({ where }),
      this.prisma.member.findMany({
        where,
        include,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const items = await mapMembers(members);

    return paginated(items, total, page, limit);
  }

  private parseQuotaStatusFilter(value?: string): QuotaStatus | undefined {
    const allowed: QuotaStatus[] = [
      "up_to_date",
      "due_soon",
      "overdue",
      "pending",
      "no_plan",
    ];
    return allowed.includes(value as QuotaStatus)
      ? (value as QuotaStatus)
      : undefined;
  }

  async findOne(organizationId: string, id: string) {
    const member = await this.prisma.member.findFirst({
      where: { id, organizationId },
      include: {
        quotaPlan: true,
        payments: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!member) {
      throw new NotFoundException("Membro nao encontrado.");
    }

    const { diasAvisoQuota } = await loadOrgReminderSettings(
      this.prisma,
      organizationId,
    );
    const lastPaid = member.payments.find(
      (p) => p.status === PaymentStatus.PAID && p.paidAt,
    );
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
      throw new BadRequestException("Ficheiro em falta.");
    }
    const ext = IMAGE_EXT[file.mimetype];
    if (!ext) {
      throw new BadRequestException("Formato invalido (usa PNG, JPG ou WEBP).");
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException("Imagem demasiado grande (max 5MB).");
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
        ...(dto.joinedAt
          ? { joinedAt: parseApiDate(dto.joinedAt, "Data de adesão") }
          : {}),
      },
    });
  }

  async update(organizationId: string, id: string, dto: UpdateMemberDto) {
    await this.findOne(organizationId, id);
    const { quotaPlanId, joinedAt, cardValidUntil, ...rest } = dto;
    return this.prisma.member.update({
      where: { id },
      data: {
        ...rest,
        ...(quotaPlanId !== undefined
          ? { quotaPlanId: quotaPlanId || null }
          : {}),
        ...(joinedAt !== undefined
          ? { joinedAt: parseApiDate(joinedAt, "Data de adesão") }
          : {}),
        ...(cardValidUntil !== undefined
          ? {
              cardValidUntil: parseOptionalApiDate(
                cardValidUntil,
                "Validade do cartão",
              ),
            }
          : {}),
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
