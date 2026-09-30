import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { PaymentStatus } from "@clubos/database";
import { verifyValidationSignature } from "../../common/qr-signature";
import { AuditService } from "../../core/audit/audit.service";
import { PrismaService } from "../../prisma/prisma.service";
import { computeQuotaSituation, type QuotaStatus } from "../members/quota.util";
import { loadOrgReminderSettings } from "../reminders/org-reminder-settings";

export interface ValidationResult {
  organization: { name: string; primaryColor: string };
  member: { name: string; number: string; active: boolean };
  status: QuotaStatus;
  validUntil: string | null;
  checkedAt: string;
}

export interface StaffScanResult extends ValidationResult {
  memberId: string;
  organizationId: string;
}

@Injectable()
export class ValidationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Validacao publica de um cartao de socio a partir do seu id (do QR).
   * Devolve apenas informacao segura para apresentar a quem valida a porta.
   */
  async validate(memberId: string): Promise<ValidationResult> {
    const member = await this.loadMember(memberId);
    return this.toPublicResult(member);
  }

  /**
   * Leitura autenticada (staff): verifica assinatura, org do pedido e grava auditoria.
   * `payload` pode ser URL completa ou path+query.
   */
  async scanForStaff(
    organizationId: string,
    userId: string,
    payload: string,
    ip?: string,
  ): Promise<StaffScanResult> {
    const parsed = this.parsePayload(payload);
    if (
      !parsed.sig ||
      !Number.isFinite(parsed.expires) ||
      !verifyValidationSignature(parsed.memberId, parsed.expires, parsed.sig)
    ) {
      throw new UnauthorizedException(
        "Link de validacao invalido ou expirado.",
      );
    }

    const member = await this.loadMember(parsed.memberId);
    if (member.organizationId !== organizationId) {
      throw new ForbiddenException(
        "Este cartao nao pertence a organizacao activa.",
      );
    }

    const result = await this.toPublicResult(member);
    await this.audit.log({
      organizationId,
      userId,
      action: "validation.scan",
      entity: "Member",
      entityId: member.id,
      meta: { status: result.status },
      ip,
    });

    return {
      ...result,
      memberId: member.id,
      organizationId: member.organizationId,
    };
  }

  private parsePayload(payload: string): {
    memberId: string;
    expires: number;
    sig: string | undefined;
  } {
    const trimmed = payload.trim();
    const asUrl = trimmed.includes("://")
      ? trimmed
      : trimmed.startsWith("validar/") || trimmed.includes("/validar/")
        ? `https://x.local/${trimmed.replace(/^\//, "")}`
        : `https://x.local/validar/${trimmed.replace(/^\//, "")}`;

    try {
      const url = new URL(asUrl);
      const parts = url.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("validar");
      const memberId =
        idx >= 0 && parts[idx + 1] ? parts[idx + 1] : parts[parts.length - 1];
      if (!memberId) throw new BadRequestException("Payload QR invalido.");
      return {
        memberId,
        expires: Number.parseInt(url.searchParams.get("expires") ?? "", 10),
        sig: url.searchParams.get("sig") ?? undefined,
      };
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException("Payload QR invalido.");
    }
  }

  private async loadMember(memberId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      include: {
        organization: true,
        quotaPlan: true,
        payments: {
          where: { status: PaymentStatus.PAID },
          orderBy: { paidAt: "desc" },
          take: 1,
        },
      },
    });
    if (!member) {
      throw new NotFoundException("Cartao invalido ou socio inexistente.");
    }

    const mod = await this.prisma.organizationModule.findFirst({
      where: {
        organizationId: member.organizationId,
        module: { slug: "qr-validation" },
        enabled: true,
      },
    });
    if (!mod) {
      throw new NotFoundException(
        "Validacao indisponivel para esta organizacao.",
      );
    }
    return member;
  }

  private async toPublicResult(
    member: Awaited<ReturnType<ValidationService["loadMember"]>>,
  ): Promise<ValidationResult> {
    const { diasAvisoQuota } = await loadOrgReminderSettings(
      this.prisma,
      member.organizationId,
    );
    const quota = computeQuotaSituation({
      periodicity: member.quotaPlan?.periodicity,
      joinedAt: member.joinedAt,
      lastPaidAt: member.payments[0]?.paidAt ?? null,
      cardValidUntil: member.cardValidUntil,
      dueSoonDays: diasAvisoQuota,
    });

    const validUntil =
      member.cardValidUntil?.toISOString() ?? quota.nextDueDate;

    return {
      organization: {
        name: member.organization.name,
        primaryColor: member.organization.primaryColor,
      },
      member: {
        name: member.name,
        number: member.number,
        active: member.status === "ACTIVE",
      },
      status: quota.status,
      validUntil,
      checkedAt: new Date().toISOString(),
    };
  }
}
