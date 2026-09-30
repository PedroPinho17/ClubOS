import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { Worker, type Job } from "bullmq";
import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import { PrismaService } from "../../prisma/prisma.service";
import { KEY_PREFIX, PUSH_QUEUE } from "../../redis/redis.constants";
import { redisConnectionOptions } from "../../redis/redis.module";
import type { PushJobData } from "./push.queue";

@Injectable()
export class PushWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PushWorker.name);
  private readonly expo = new Expo();
  private worker?: Worker<PushJobData>;
  private ticketMap = new Map<string, string>(); // ticketId -> deviceTokenId

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    this.worker = new Worker<PushJobData>(
      PUSH_QUEUE,
      (job) => this.process(job),
      {
        connection: redisConnectionOptions(),
        prefix: `${KEY_PREFIX}:bull`,
        concurrency: 5,
      },
    );

    this.worker.on("failed", (job, err) =>
      this.logger.error(`Push falhou (${job?.data.token}): ${err.message}`),
    );
  }

  private async process(job: Job<PushJobData>): Promise<void> {
    const { token, title, body, data, deviceTokenId } = job.data;
    if (!Expo.isExpoPushToken(token)) {
      await this.prisma.deviceToken.update({
        where: { id: deviceTokenId },
        data: { disabledAt: new Date() },
      });
      return;
    }

    const message: ExpoPushMessage = {
      to: token,
      sound: "default",
      title,
      body,
      data,
      channelId: "default",
    };

    const tickets = await this.expo.sendPushNotificationsAsync([message]);
    for (const ticket of tickets) {
      if (ticket.status === "error") {
        const err = ticket.details?.error;
        if (err === "DeviceNotRegistered") {
          await this.prisma.deviceToken.update({
            where: { id: deviceTokenId },
            data: { disabledAt: new Date() },
          });
        }
        this.logger.warn(`Expo ticket error: ${ticket.message}`);
      } else if (ticket.status === "ok" && ticket.id) {
        this.ticketMap.set(ticket.id, deviceTokenId);
      }
    }
  }

  /** Le recibos Expo ~15 min apos envios (job agendado). */
  @Cron("*/15 * * * *")
  async checkReceipts(): Promise<void> {
    const ids = [...this.ticketMap.keys()].slice(0, 100);
    if (ids.length === 0) return;

    try {
      const receipts = await this.expo.getPushNotificationReceiptsAsync(ids);
      for (const [id, receipt] of Object.entries(receipts)) {
        const deviceTokenId = this.ticketMap.get(id);
        this.ticketMap.delete(id);
        if (!deviceTokenId) continue;
        if (receipt.status === "error") {
          const err = receipt.details?.error;
          if (err === "DeviceNotRegistered") {
            await this.prisma.deviceToken.update({
              where: { id: deviceTokenId },
              data: { disabledAt: new Date() },
            });
          }
        }
      }
    } catch (e) {
      this.logger.warn(`Falha ao ler receipts Expo: ${(e as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
