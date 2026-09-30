import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@clubos/database";
import { PrismaService } from "../../prisma/prisma.service";
import type { RegisterDeviceDto } from "./dto";
import { PushQueue } from "./push.queue";

export type PushKind = "quotas" | "communications" | "payments";

@Injectable()
export class PushService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: PushQueue,
  ) {}

  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    const existing = await this.prisma.deviceToken.findUnique({
      where: { token: dto.token },
    });

    if (existing) {
      return this.prisma.deviceToken.update({
        where: { token: dto.token },
        data: {
          userId,
          platform: dto.platform,
          appVersion: dto.appVersion,
          organizationId: dto.organizationId ?? existing.organizationId,
          preferences: (dto.preferences ??
            existing.preferences ??
            undefined) as Prisma.InputJsonValue | undefined,
          lastSeenAt: new Date(),
          disabledAt: null,
        },
      });
    }

    return this.prisma.deviceToken.create({
      data: {
        userId,
        token: dto.token,
        platform: dto.platform,
        appVersion: dto.appVersion,
        organizationId: dto.organizationId,
        preferences: (dto.preferences ?? {
          quotas: true,
          communications: true,
          payments: true,
        }) as Prisma.InputJsonValue,
      },
    });
  }

  async unregisterDevice(userId: string, token: string) {
    const row = await this.prisma.deviceToken.findFirst({
      where: { token, userId },
    });
    if (!row) throw new NotFoundException("Dispositivo nao encontrado.");
    await this.prisma.deviceToken.update({
      where: { id: row.id },
      data: { disabledAt: new Date() },
    });
    return { ok: true };
  }

  async listDevices(userId: string) {
    return this.prisma.deviceToken.findMany({
      where: { userId, disabledAt: null },
      orderBy: { lastSeenAt: "desc" },
    });
  }

  async updatePreferences(
    userId: string,
    token: string,
    preferences: Record<string, boolean | undefined>,
  ) {
    const row = await this.prisma.deviceToken.findFirst({
      where: { token, userId },
    });
    if (!row) throw new NotFoundException("Dispositivo nao encontrado.");
    return this.prisma.deviceToken.update({
      where: { id: row.id },
      data: {
        preferences: preferences as Prisma.InputJsonValue,
        lastSeenAt: new Date(),
      },
    });
  }

  /**
   * Enfileira push para um utilizador. Payload minimo (sem dados pessoais).
   */
  async notifyUser(
    userId: string,
    kind: PushKind,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    const devices = await this.prisma.deviceToken.findMany({
      where: { userId, disabledAt: null },
    });

    const jobs = devices
      .filter((d) => {
        const prefs = (d.preferences ?? {}) as Record<string, boolean>;
        return prefs[kind] !== false;
      })
      .map((d) => ({
        token: d.token,
        title,
        body,
        data: data ?? {},
        deviceTokenId: d.id,
      }));

    if (jobs.length === 0) return { enqueued: 0 };
    await this.queue.enqueueMany(jobs);
    return { enqueued: jobs.length };
  }

  async notifyMembers(
    memberUserIds: string[],
    kind: PushKind,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    let total = 0;
    for (const userId of memberUserIds) {
      const r = await this.notifyUser(userId, kind, title, body, data);
      total += r.enqueued;
    }
    return { enqueued: total };
  }
}
